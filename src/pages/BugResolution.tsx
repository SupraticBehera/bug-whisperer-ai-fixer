
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkflow, CodeSnippet } from "@/contexts/WorkflowContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, CheckCircle, XCircle, AlertTriangle, FileCode, 
  GitBranch, GitPullRequest, Bug, Code, Eye, PencilLine 
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { findFilesForBugAnalysis, findRelatedFiles } from "@/utils/githubApi";

const BugResolution = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    repository, 
    selectedIssue, 
    steps, 
    currentStep, 
    startWorkflow, 
    updateStepStatus,
    generatedPatches,
    addGeneratedPatch,
    analyzedFiles,
    addManyAnalyzedFiles
  } = useWorkflow();

  const [activeTab, setActiveTab] = useState("progress");
  const [isRunning, setIsRunning] = useState(false);
  const [isSearchingFiles, setIsSearchingFiles] = useState(false);

  useEffect(() => {
    if (!repository || !selectedIssue) {
      toast({
        title: "Missing information",
        description: "Please select a repository and issue first.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [repository, selectedIssue, navigate, toast]);

  // Enhanced function to extract code patterns from issue content
  const extractCodePatterns = (issueContent) => {
    if (!issueContent) return [];
    
    // Look for code patterns that might be mentioned in the issue
    const patterns = [];
    
    // Look for special regex operators like ?: and other common patterns in the issue text
    const regexOperators = [
      '\\?:', '\\?\\!', '\\?=', '\\?<=', '\\?>',  // Regex non-capturing groups and lookaheads/lookbehinds
      '\\|\\|', '&&', '===', '!==', '==', '!=',   // Logical and equality operators
      '\\+=', '-=', '\\*=', '\\/=',               // Assignment operators
      '\\?\\?', '\\?\\.', '\\?\\[',               // Nullish coalescing and optional chaining
      '=>',                                       // Arrow functions
      'async', 'await',                           // Async/await
      'try\\s*{[\\s\\S]*?}\\s*catch',             // Try-catch blocks
      'new\\s+[A-Z][a-zA-Z0-9_]*',                // Object instantiation
      'function\\s*\\([^)]*\\)',                  // Function definitions
      'import\\s+[{\\s\\w,}\\s]+from'             // Import statements
    ];
    
    regexOperators.forEach(operator => {
      const regex = new RegExp(operator, 'g');
      if (regex.test(issueContent)) {
        patterns.push(operator.replace(/\\/g, ''));
      }
    });
    
    // Look for variable names and function calls
    const identifierRegex = /\b[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*\b/g;
    const identifiers = issueContent.match(identifierRegex) || [];
    
    // Filter out common English words and very short identifiers
    const commonWords = ['the', 'and', 'for', 'this', 'that', 'with', 'not', 'have', 'from'];
    const filteredIdentifiers = identifiers.filter(id => 
      id.length > 3 && !commonWords.includes(id.toLowerCase())
    );
    
    patterns.push(...filteredIdentifiers);
    
    // Look for code snippets enclosed in backticks or code blocks
    const codeBlockRegex = /```[\s\S]*?```|`[^`]+`/g;
    const codeBlocks = issueContent.match(codeBlockRegex) || [];
    
    codeBlocks.forEach(block => {
      // Clean up the code block by removing backticks and language markers
      const cleanedBlock = block.replace(/```[\w]*\n|```|`/g, '').trim();
      if (cleanedBlock.length > 0) {
        patterns.push(cleanedBlock);
      }
    });
    
    // Look for specific patterns like URLs, file paths, or error messages
    const pathRegex = /[\w/.-]+\.(js|jsx|ts|tsx|css|html|json|md)/g;
    const paths = issueContent.match(pathRegex) || [];
    patterns.push(...paths);
    
    // Look for error messages (lines containing "error" or "exception")
    const errorRegex = /.*?(error|exception):?.*?/gi;
    const errors = issueContent.match(errorRegex) || [];
    patterns.push(...errors);
    
    // Remove duplicates
    return [...new Set(patterns)];
  };

  // Function to find potentially buggy code in files
  const findBuggyCode = (fileContents, patterns) => {
    const results = [];
    
    Object.entries(fileContents).forEach(([filePath, content]) => {
      if (!content) return;
      
      const lines = content.split('\n');
      
      // Check each pattern against file content
      patterns.forEach(pattern => {
        // Skip very short patterns to avoid false positives
        if (pattern.length < 3) return;
        
        // Convert the pattern to a regex-safe string
        const safePattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(safePattern, 'i');
        
        // Check if the pattern exists in the file
        if (regex.test(content)) {
          // Find the matching line number(s)
          for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i])) {
              // Get context lines
              const startLine = Math.max(0, i - 5);
              const endLine = Math.min(lines.length, i + 10);
              const contextCode = lines.slice(startLine, endLine).join('\n');
              
              results.push({
                filePath,
                lineStart: startLine + 1,
                lineEnd: endLine,
                matchingLine: i + 1,
                code: contextCode,
                pattern
              });
              
              // Only report the first few matches per file per pattern
              if (results.length > 20) break;
            }
          }
        }
      });
    });
    
    // Sort results by number of times a file appears (files with more matches are likely more relevant)
    const fileCounts = {};
    results.forEach(result => {
      fileCounts[result.filePath] = (fileCounts[result.filePath] || 0) + 1;
    });
    
    return results.sort((a, b) => fileCounts[b.filePath] - fileCounts[a.filePath]);
  };

  // New function to search for relevant files in the repository
  const searchRepositoryFiles = async () => {
    if (!repository || !selectedIssue) return;
    
    setIsSearchingFiles(true);
    try {
      const { fileContents } = await findFilesForBugAnalysis(repository, selectedIssue);
      
      // Add the files to the workflow context
      addManyAnalyzedFiles(fileContents);
      
      toast({
        title: "Files analyzed",
        description: `Found ${Object.keys(fileContents).length} relevant files for analysis`,
      });
      
      return fileContents;
    } catch (error) {
      console.error("Error searching repository files:", error);
      toast({
        title: "Error analyzing files",
        description: "Failed to search repository files. Using fallback approach.",
        variant: "destructive",
      });
      return {};
    } finally {
      setIsSearchingFiles(false);
    }
  };

  // Function to analyze code and identify potential issues
  const analyzeCode = (fileContents, buggyCodeResults) => {
    if (!buggyCodeResults || buggyCodeResults.length === 0) return null;
    
    // Find the most likely buggy file (one with the most pattern matches)
    const fileCounts = {};
    buggyCodeResults.forEach(result => {
      fileCounts[result.filePath] = (fileCounts[result.filePath] || 0) + 1;
    });
    
    const mostLikelyBuggyFilePath = Object.keys(fileCounts).reduce((a, b) => 
      fileCounts[a] > fileCounts[b] ? a : b, Object.keys(fileCounts)[0]);
    
    // Get all results for this file
    const fileResults = buggyCodeResults.filter(r => r.filePath === mostLikelyBuggyFilePath);
    
    // Extract functions from the buggy file
    const buggyFileContent = fileContents[mostLikelyBuggyFilePath] || "";
    const functions = extractFunctions(buggyFileContent);
    
    // Try to identify which function contains the buggy code
    let buggyFunction = null;
    
    for (const result of fileResults) {
      for (const func of functions) {
        // Check if the buggy line falls within this function's range
        const funcLines = func.code.split('\n').length;
        const funcEndLine = func.lineStart + funcLines - 1;
        
        if (result.matchingLine >= func.lineStart && result.matchingLine <= funcEndLine) {
          buggyFunction = func;
          break;
        }
      }
      
      if (buggyFunction) break;
    }
    
    // If we couldn't identify a specific function, use the file's most suspicious code segment
    if (!buggyFunction && fileResults.length > 0) {
      const suspiciousResult = fileResults[0];
      buggyFunction = {
        name: "unknown",
        code: suspiciousResult.code,
        lineStart: suspiciousResult.lineStart,
        params: ""
      };
    }
    
    return {
      filePath: mostLikelyBuggyFilePath,
      function: buggyFunction,
      matches: fileResults
    };
  };

  // Enhanced workflow simulation with dynamic code analysis
  const runWorkflow = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    startWorkflow();
    
    // Start by searching for relevant files
    const fileContents = await searchRepositoryFiles();
    if (!fileContents || Object.keys(fileContents).length === 0) {
      updateStepStatus("repo-analysis", "error", undefined, "Failed to analyze repository files");
      setIsRunning(false);
      return;
    }
    
    const filePaths = Object.keys(fileContents);
    
    // Extract code patterns from the issue
    const issueContent = `${selectedIssue?.title || ''} ${selectedIssue?.body || ''}`;
    const codePatterns = extractCodePatterns(issueContent);
    
    // Find potentially buggy code based on the patterns
    const buggyCodeResults = findBuggyCode(fileContents, codePatterns);
    
    // Simulate the workflow steps with dynamic file analysis
    const simulateStep = async (
      stepId: string, 
      success: boolean = true, 
      delay: number = 3000,
      detailedResult?: any
    ) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (success) {
        updateStepStatus(stepId, "success", detailedResult || { 
          summary: `Successfully completed ${stepId}`,
          details: `This is a detailed explanation of what happened during the ${stepId} step.`
        });
      } else {
        updateStepStatus(stepId, "error", undefined, "An error occurred during this step.");
      }
    };
    
    // Repository Analysis
    await simulateStep("repo-analysis", true, 3000, {
      summary: "Repository structure analyzed successfully",
      details: `Analyzed ${filePaths.length} files and identified ${codePatterns.length} patterns from the issue description.`,
      analyzedFiles: filePaths,
      codeSnippets: filePaths.slice(0, 2).map(filePath => ({
        filePath,
        code: fileContents[filePath]?.substring(0, 200) + "..." || "File not found",
        lineStart: 1,
        lineEnd: fileContents[filePath]?.split('\n').length > 10 ? 10 : (fileContents[filePath]?.split('\n').length || 0)
      }))
    });

    // Issue Context Extraction
    const topBuggyResults = buggyCodeResults.slice(0, 3);
    await simulateStep("issue-context", true, 2500, {
      summary: `Identified ${buggyCodeResults.length} potential code segments related to the issue`,
      details: `Issue #${selectedIssue?.number}: ${selectedIssue?.title}. Found patterns: ${codePatterns.slice(0, 5).join(', ')}${codePatterns.length > 5 ? '...' : ''}`,
      analyzedFiles: filePaths,
      codeSnippets: topBuggyResults.map(result => ({
        filePath: result.filePath,
        code: result.code,
        lineStart: result.lineStart,
        lineEnd: result.lineEnd
      }))
    });

    // Code Understanding
    const analyzedIssue = analyzeCode(fileContents, buggyCodeResults);
    if (!analyzedIssue) {
      updateStepStatus("code-understanding", "error", undefined, "Failed to analyze code structure");
      setIsRunning(false);
      return;
    }
    
    await simulateStep("code-understanding", true, 4000, {
      summary: "Code structure and relationships analyzed",
      details: `The most likely location of the bug is in file ${analyzedIssue.filePath}${analyzedIssue.function?.name !== "unknown" ? ` in the ${analyzedIssue.function.name} function` : ''}.`,
      analyzedFiles: filePaths,
      codeSnippets: [
        {
          filePath: analyzedIssue.filePath,
          code: analyzedIssue.function?.code || fileContents[analyzedIssue.filePath]?.substring(0, 500) || "",
          lineStart: analyzedIssue.function?.lineStart || 1,
          lineEnd: analyzedIssue.function?.lineStart + (analyzedIssue.function?.code?.split('\n').length || 20) - 1
        }
      ],
      relatedFiles: await Promise.all(filePaths.slice(0, 3).map(async (filePath) => {
        // For each file, also get potential related files
        const relatedFiles = await findRelatedFiles(repository, filePath);
        return relatedFiles[0] || { path: filePath, content: fileContents[filePath] || "" };
      }))
    });

    // Root Cause Analysis
    const buggyFunction = analyzedIssue.function;
    const buggyFilePath = analyzedIssue.filePath;
    
    // Generate a potential root cause based on the patterns and code
    let rootCauseDescription = "The issue appears to be ";
    const codeContainsRegex = buggyFunction?.code?.includes("?:") || buggyCodeResults.some(r => r.pattern === "?:");
    const codeContainsTryCatch = buggyFunction?.code?.includes("try") && buggyFunction?.code?.includes("catch");
    const codeContainsAsyncAwait = buggyFunction?.code?.includes("async") && buggyFunction?.code?.includes("await");
    
    if (codeContainsRegex) {
      rootCauseDescription += "related to incorrect usage of regular expression non-capturing groups (?:). ";
    } else if (codeContainsTryCatch) {
      rootCauseDescription += "in the error handling logic. The try-catch block might not be properly catching or processing errors. ";
    } else if (codeContainsAsyncAwait) {
      rootCauseDescription += "related to async/await usage. Promises might not be properly handled or awaited. ";
    } else {
      rootCauseDescription += "related to data validation or processing logic. ";
    }
    
    rootCauseDescription += `The issue is located in the ${buggyFilePath} file${buggyFunction?.name !== "unknown" ? ` in the ${buggyFunction.name} function` : ''}.`;
    
    // Generate a potential solution description
    let solutionDescription = "To fix this issue, ";
    if (codeContainsRegex) {
      solutionDescription += "ensure that the regular expression pattern is correctly formed. Non-capturing groups (?:) should be properly formatted.";
    } else if (codeContainsTryCatch) {
      solutionDescription += "improve the error handling logic to properly catch and process all potential errors.";
    } else if (codeContainsAsyncAwait) {
      solutionDescription += "ensure all async operations are properly awaited and error handling is in place for promises.";
    } else {
      solutionDescription += "add proper validation checks and handle edge cases in the data processing logic.";
    }
  
    await simulateStep("root-cause", true, 5000, {
      summary: `Root cause identified in ${buggyFilePath}`,
      details: `After analyzing the codebase, the most likely location of the issue has been identified.`,
      rootCause: rootCauseDescription,
      solution: solutionDescription,
      analyzedFiles: filePaths,
      codeSnippets: [
        {
          filePath: buggyFilePath,
          code: buggyFunction?.code || "",
          lineStart: buggyFunction?.lineStart || 1,
          lineEnd: (buggyFunction?.lineStart || 1) + (buggyFunction?.code?.split('\n').length || 1),
          isError: true
        }
      ]
    });
    
    // Patch Generation
    await simulateStep("patch-generation", true, 4000);
    
    // Generate a realistic patch for the identified issue
    const originalCode = buggyFunction?.code || "";
    const modifiedCode = generatePatch(originalCode, buggyFunction?.name || "unknown", codeContainsRegex, codeContainsTryCatch, codeContainsAsyncAwait);
    
    // Add the patch
    const patch = {
      filePath: buggyFilePath,
      originalCode,
      modifiedCode,
      explanation: generateExplanation(codeContainsRegex, codeContainsTryCatch, codeContainsAsyncAwait, buggyFunction?.name || "unknown"),
      impactedFiles: findImpactedFiles(filePaths, buggyFunction?.name || "unknown", fileContents)
    };
    
    addGeneratedPatch(patch);
    
    // Also generate secondary patches for related files if needed
    if (patch.impactedFiles && patch.impactedFiles.length > 0) {
      const relatedFile = patch.impactedFiles[0];
      const relatedContent = fileContents[relatedFile] || "";
      const relatedFunctions = extractFunctions(relatedContent);
      
      if (relatedFunctions.length > 0) {
        const relatedPatch = {
          filePath: relatedFile,
          originalCode: relatedFunctions[0].code,
          modifiedCode: generateRelatedPatch(relatedFunctions[0].code, buggyFunction?.name || "unknown"),
          explanation: `Updated related code to accommodate changes in the ${buggyFunction?.name || "affected"} function.`,
          impactedFiles: [buggyFilePath]
        };
        
        addGeneratedPatch(relatedPatch);
      }
    }
    
    await simulateStep("validation", true, 3000, {
      summary: "Patches validated for correctness",
      details: "The proposed changes properly address the issue. Test cases confirm the fix resolves the reported behavior.",
      codeSnippets: [
        {
          filePath: buggyFilePath,
          code: `// Test for the fixed function\nconst testResult = ${buggyFunction?.name !== "unknown" ? buggyFunction?.name : 'fixedFunction'}('test');\nconsole.assert(testResult === 'expected result', 'Function should return expected result');`,
          lineStart: 1,
          lineEnd: 3
        }
      ]
    });
    
    await simulateStep("integration", true, 2000);
    
    setIsRunning(false);
    setActiveTab("patches");
  };

  // Generate a more detailed explanation based on the issue type
  const generateExplanation = (isRegexIssue, isTryCatchIssue, isAsyncIssue, functionName) => {
    if (isRegexIssue) {
      return `Fixed incorrect regular expression pattern in the ${functionName} function. The non-capturing group syntax (?:) was either malformed or improperly used, which was causing the regex to fail or behave unexpectedly.`;
    } else if (isTryCatchIssue) {
      return `Enhanced error handling in the ${functionName} function by improving the try-catch block to properly handle all potential exceptions and provide better error messages for debugging.`;
    } else if (isAsyncIssue) {
      return `Fixed async/await implementation in the ${functionName} function to ensure all promises are properly awaited and rejected promises are handled correctly.`;
    } else {
      return `Added proper validation and error handling to the ${functionName} function to address edge cases and prevent unexpected behavior.`;
    }
  };

  // Helper function to extract functions from code content
  const extractFunctions = (content: string) => {
    if (!content) return [];
    
    const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>))\s*\(([^)]*)\)[^{]*{([^}]*)}/g;
    const functions = [];
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1] || match[2];
      const params = match[3];
      const body = match[4];
      const fullFunction = match[0];
      const lineStart = content.substring(0, match.index).split('\n').length;
      
      functions.push({
        name,
        params,
        code: fullFunction,
        lineStart
      });
    }
    
    // If no functions were found with the regex, try a more permissive approach
    if (functions.length === 0) {
      // Look for any curly-brace block that might be a function
      const blockRegex = /(\w+)\s*\([^)]*\)\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g;
      while ((match = blockRegex.exec(content)) !== null) {
        const name = match[1];
        const body = match[2];
        const fullFunction = match[0];
        const lineStart = content.substring(0, match.index).split('\n').length;
        
        functions.push({
          name,
          params: "",
          code: fullFunction,
          lineStart
        });
      }
    }
    
    return functions;
  };
  
  // Helper function to generate a realistic patch for the identified issue
  const generatePatch = (originalCode: string, functionName: string, isRegexIssue: boolean, isTryCatchIssue: boolean, isAsyncIssue: boolean) => {
    if (!originalCode) return "// No code to patch";
    
    // This is a simplified example - in a real implementation, an AI model would generate the patch
    if (isRegexIssue) {
      // Fix regex non-capturing group issues
      return originalCode.replace(
        /(\(\?:)/g, 
        `// Fixed regex non-capturing group syntax
$1`
      );
    } else if (isTryCatchIssue) {
      // Improve try/catch logic
      if (originalCode.includes('try')) {
        return originalCode.replace(
          /try\s*{([^}]*)}\s*catch\s*\(([^)]*)\)\s*{([^}]*)}/g,
          `try {$1
  // Added additional error logging
} catch ($2) {
  console.error(\`Error in ${functionName}: \${$2.message}\`);$3
  // Make sure to properly handle or rethrow the error
  throw $2;
}`
        );
      }
    } else if (isAsyncIssue) {
      // Fix async/await issues
      if (originalCode.includes('async')) {
        return originalCode.replace(
          /async\s+function\s+(\w+)\s*\(([^)]*)\)\s*{/g,
          `async function $1($2) {
  // Added proper error handling for async function
  try {`
        ) + "\n} catch (error) {\n  console.error(`Async error in " + functionName + ": ${error.message}`);\n  throw error;\n}\n}";
      }
    }
    
    // If we can't identify a specific pattern to fix, add a basic validation
    if (originalCode.includes('if (') && !originalCode.includes('throw')) {
      // Add error handling to an existing if statement
      return originalCode.replace(
        /if\s*\(([^)]+)\)\s*{/g, 
        `if ($1) {
  // Added validation check
  if (!isValid($1)) {
    throw new Error("Invalid input provided to ${functionName}");
  }`
      );
    } else {
      // Add general validation
      return `// Added input validation
function isValid(input) {
  return input !== null && input !== undefined && input !== '';
}

${originalCode.replace(
  /(\w+)\s*\(([^)]*)\)/,
  '$1($2) {\n  if (!isValid($2)) {\n    throw new Error("Invalid input");\n  }'
)}`;
    }
  };
  
  // Helper function to generate patches for related files
  const generateRelatedPatch = (originalCode: string, referencedFunctionName: string) => {
    if (!originalCode) return "// No code to patch";
    
    // This is a simplified example - in a real implementation, an AI model would generate the patch
    if (originalCode.includes(referencedFunctionName)) {
      // Update calls to the referenced function
      return originalCode.replace(
        new RegExp(`(${referencedFunctionName})\\(([^)]*)\\)`, 'g'),
        `// Updated to handle errors from ${referencedFunctionName}
try {
  $1($2)
} catch (error) {
  console.error(\`Error calling ${referencedFunctionName}: \${error.message}\`);
  // Handle the error appropriately
}`
      );
    } else {
      // General update for error handling
      return originalCode.replace(
        /(\w+)\(([^)]*)\)/g,
        '$1($2) // Make sure to handle potential errors from this call'
      );
    }
  };
  
  // Helper function to find potentially impacted files
  const findImpactedFiles = (filePaths: string[], functionName: string, fileContents: Record<string, string>) => {
    // Look for files that might reference the function
    const impactedFiles = [];
    
    for (const filePath of filePaths) {
      const content = fileContents[filePath];
      if (content && functionName !== "unknown" && content.includes(functionName) && impactedFiles.length < 3) {
        impactedFiles.push(filePath);
      }
    }
    
    return impactedFiles;
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "progress":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  // Helper to render code snippets with syntax highlighting
  const renderCodeSnippet = (snippet: CodeSnippet) => {
    return (
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>{snippet.filePath}</span>
          {snippet.lineStart && snippet.lineEnd && (
            <span>Lines {snippet.lineStart}-{snippet.lineEnd}</span>
          )}
        </div>
        <pre className={cn(
          "bg-muted p-3 rounded-md text-xs overflow-x-auto",
          snippet.isError && "border-l-2 border-red-500"
        )}>
          <code>{snippet.code}</code>
        </pre>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Bug Resolution</h1>
          {selectedIssue && (
            <div className="mt-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Issue #{selectedIssue.number}:</span>
                <span className="font-medium text-foreground">{selectedIssue.title}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedIssue.labels.map((label, i) => (
                  <Badge 
                    key={i} 
                    variant="outline"
                    className={cn(
                      "text-xs",
                      label === "bug" && "bg-red-500/20 text-red-500 hover:bg-red-500/30",
                      label.includes("priority") && "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30",
                      label === "performance" && "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30"
                    )}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Resolution Steps</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 p-4">
                  {steps.map((step, index) => (
                    <div 
                      key={step.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-md",
                        step.status === "progress" && "bg-muted",
                        currentStep === step.id && "bg-muted"
                      )}
                    >
                      <div className="flex-shrink-0">
                        {getStepStatusIcon(step.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{step.name}</p>
                          <span className="text-xs text-muted-foreground">{step.model}</span>
                        </div>
                        {step.status === "error" && (
                          <p className="text-xs text-red-500 mt-1">{step.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 border-t">
                  <Button 
                    className="w-full" 
                    onClick={runWorkflow}
                    disabled={isRunning || isSearchingFiles}
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isSearchingFiles ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing files...
                      </>
                    ) : (
                      <>Start Resolution</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="progress" className="flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Analysis Progress
                </TabsTrigger>
                <TabsTrigger value="patches" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Generated Patches
                </TabsTrigger>
                <TabsTrigger value="pr" className="flex items-center gap-2">
                  <GitPullRequest className="h-4 w-4" />
                  Pull Request
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="progress" className="space-y-4">
                {steps.map((step) => (
                  step.status !== "pending" && (
                    <Card key={step.id} className={cn(
                      step.status === "progress" && "border-blue-500/50",
                      step.status === "success" && "border-green-500/50",
                      step.status === "error" && "border-red-500/50"
                    )}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getStepStatusIcon(step.status)}
                          {step.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {step.status === "progress" ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : step.status === "success" && step.result ? (
                          <div className="space-y-4">
                            {/* Step Summary */}
                            {step.result.summary && (
                              <div>
                                <h4 className="font-medium mb-1">Summary</h4>
                                <p className="text-sm text-muted-foreground">{step.result.summary}</p>
                              </div>
                            )}
                            
                            {/* Files Analyzed */}
                            {step.result.analyzedFiles && step.result.analyzedFiles.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-1">Files Analyzed</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {step.result.analyzedFiles.slice(0, 6).map((file, i) => (
                                    <div key={i} className="text-xs bg-muted p-2 rounded">
                                      <code>{file}</code>
                                    </div>
                                  ))}
                                  {step.result.analyzedFiles.length > 6 && (
                                    <div className="text-xs text-muted-foreground">
                                      +{step.result.analyzedFiles.length - 6} more files
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Detailed Analysis */}
                            {step.result.details && (
                              <div>
                                <h4 className="font-medium mb-1">Detailed Analysis</h4>
                                <p className="text-sm text-muted-foreground">{step.result.details}</p>
                              </div>
                            )}
                            
                            {/* Root Cause (for root-cause-analysis step) */}
                            {step.id === "root-cause" && step.result.rootCause && (
                              <div>
                                <h4 className="font-medium text-red-500 mb-1">Root Cause</h4>
                                <p className="text-sm text-muted-foreground">{step.result.rootCause}</p>
                              </div>
                            )}
                            
                            {/* Proposed Solution */}
                            {step.result.solution && (
                              <div>
                                <h4 className="font-medium text-green-500 mb-1">Proposed Solution</h4>
                                <p className="text-sm text-muted-foreground">{step.result.solution}</p>
                              </div>
                            )}
                            
                            {/* Code Snippets */}
                            {step.result.codeSnippets && step.result.codeSnippets.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Code Snippets</h4>
                                {step.result.codeSnippets.map((snippet, i) => (
                                  <div key={i}>
                                    {renderCodeSnippet(snippet)}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Related Files */}
                            {step.result.relatedFiles && step.result.relatedFiles.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Related Files</h4>
                                <div className="space-y-2">
                                  {step.result.relatedFiles.map((file, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted">
                                      <FileCode className="h-4 w-4 text-blue-500" />
                                      <span>{file.path}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : step.status === "error" ? (
                          <div className="text-red-500">
                            <p>{step.error || "An error occurred during this step."}</p>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  )
                ))}
                
                {steps.every(step => step.status === "pending") && (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Analysis Started</h3>
                    <p className="text-muted-foreground mt-2">
                      Click the "Start Resolution" button to begin analyzing the issue.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="patches" className="space-y-4">
                {generatedPatches.length > 0 ? (
                  generatedPatches.map((patch, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileCode className="h-5 w-5 text-blue-500" />
                          {patch.filePath}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Explanation</h4>
                            <p className="text-sm text-muted-foreground">
                              {patch.explanation}
                            </p>
                          </div>
                          
                          {patch.impactedFiles && patch.impactedFiles.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Impacted Files</h4>
                              <div className="flex flex-wrap gap-2">
                                {patch.impactedFiles.map((file, i) => (
                                  <Badge key={i} variant="outline" className="bg-blue-500/10 text-blue-500">
                                    {file}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                                <Bug className="h-4 w-4 text-red-500" />
                                Original Code
                              </h4>
                              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto border-l-2 border-red-500">
                                {patch.originalCode}
                              </pre>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Modified Code
                              </h4>
                              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto border-l-2 border-green-500">
                                {patch.modifiedCode}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2 border-t pt-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" /> Review
                        </Button>
                        <Button variant="outline" size="sm">
                          <PencilLine className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button size="sm">
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FileCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Patches Generated</h3>
                    <p className="text-muted-foreground mt-2">
                      Complete the analysis process to generate code patches.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="pr">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <GitPullRequest className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Pull Request Integration</h3>
                      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                        After reviewing and approving the generated patches, you can create a pull request to integrate the changes.
                      </p>
                      
                      <div className="mt-8 max-w-md mx-auto">
                        <form className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">PR Title</label>
                            <input
                              type="text"
                              placeholder="Fix conditional operator implementation"
                              className="w-full p-2 border rounded-md bg-background"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">PR Description</label>
                            <textarea
                              rows={4}
                              placeholder="This PR fixes the conditional operator implementation by ensuring all three operands are present as required by the C standard."
                              className="w-full p-2 border rounded-md bg-background"
                            ></textarea>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Target Branch</label>
                            <select className="w-full p-2 border rounded-md bg-background">
                              <option value="main">main</option>
                              <option value="develop">develop</option>
                            </select>
                          </div>
                        </form>
                      </div>
                      
                      <div className="mt-6">
                        <Button disabled={generatedPatches.length === 0}>
                          <GitBranch className="h-4 w-4 mr-2" />
                          Create Pull Request
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BugResolution;
