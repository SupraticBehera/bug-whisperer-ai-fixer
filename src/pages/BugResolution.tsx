
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
    generatedPatches
  } = useWorkflow();

  const [activeTab, setActiveTab] = useState("progress");
  const [isRunning, setIsRunning] = useState(false);

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

  // Mock function to simulate the AI workflow with enhanced details
  const runWorkflow = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    startWorkflow();
    
    // Simulate the workflow steps with delays and detailed information
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
      details: "Identified key source files and dependencies. The repository follows a standard structure with separate directories for source code, tests, and documentation.",
      codeSnippets: [
        {
          filePath: "src/parser.c",
          code: "typedef struct Token Token;\nstruct Token {\n  TokenKind kind;\n  Token *next;\n  int val;\n  char *loc;\n  int len;\n};\n",
          lineStart: 10,
          lineEnd: 16
        }
      ]
    });

    // Issue Context Extraction
    await simulateStep("issue-context", true, 2500, {
      summary: "Issue context extracted from description and comments",
      details: `The issue relates to a problem with the conditional operator (?:) in the parser. The parser currently allows the conditional operator without the third operand, which violates the C standard.`,
      codeSnippets: [
        {
          filePath: "src/parser.c",
          code: "// Current implementation allows: expr ? expr : \n// but C standard requires three operands: expr ? expr : expr",
          isError: true
        }
      ]
    });

    // Code Understanding
    await simulateStep("code-understanding", true, 4000, {
      summary: "Code structure and relationships analyzed",
      details: "The parser handles conditional expressions in the `conditional` function, which fails to properly validate the presence of all three required operands.",
      codeSnippets: [
        {
          filePath: "src/parser.c",
          code: "// Function that parses conditional expressions\nstatic Node *conditional(Token **rest, Token *tok) {\n  Node *cond = logor(rest, tok);\n\n  if (!equal(tok, \"?\"))\n    return cond;\n\n  Node *node = new_node(ND_COND, tok);\n  node->cond = cond;\n  node->then = expr(&tok, tok->next);\n  tok = skip(tok, \":\");\n  node->els = conditional(rest, tok); // No validation if ':' isn't followed by an expression\n\n  return node;\n}",
          lineStart: 105,
          lineEnd: 117
        }
      ],
      relatedFiles: [
        { path: "src/tokenize.c", content: "// Contains the tokenizer implementation" },
        { path: "src/parse.h", content: "// Contains node type definitions" }
      ]
    });

    // Root Cause Analysis  
    await simulateStep("root-cause", true, 5000, {
      summary: "Root cause identified: Missing validation for third operand",
      details: "The parser's conditional function doesn't validate that a valid expression follows the colon in a conditional expression. According to the C standard (6.5.15p3), the conditional operator requires three operands.",
      rootCause: "The issue is in src/parser.c in the conditional function. It skips the colon token but doesn't validate that a valid expression follows it.",
      solution: "Modify the conditional function to verify that a valid expression follows the colon and report an error if it's missing.",
      codeSnippets: [
        {
          filePath: "src/parser.c",
          code: "node->cond = cond;\nnode->then = expr(&tok, tok->next);\ntok = skip(tok, \":\");\nnode->els = conditional(rest, tok); // Problem: No validation if an expression exists after ':'",
          lineStart: 112,
          lineEnd: 114,
          isError: true
        }
      ]
    });
    
    // Patch Generation
    await simulateStep("patch-generation", true, 4000);
    
    // Add mock patches with interconnected file impacts
    const mockPatches = [
      {
        filePath: "src/parser.c",
        originalCode: "node->cond = cond;\nnode->then = expr(&tok, tok->next);\ntok = skip(tok, \":\");\nnode->els = conditional(rest, tok);",
        modifiedCode: "node->cond = cond;\nnode->then = expr(&tok, tok->next);\ntok = skip(tok, \":\");\n\n// Ensure there's an expression after the colon\nif (at_eof(tok) || equal(tok, \";\")) {\n  error_tok(tok, \"expected expression after ':'\");\n}\nnode->els = conditional(rest, tok);",
        explanation: "Added validation to ensure an expression follows the colon in conditional expressions, as required by the C standard (6.5.15p3).",
        impactedFiles: ["src/parser.c", "test/conditional.c"]
      },
      {
        filePath: "test/conditional.c",
        originalCode: "void test_conditional() {\n  // Test valid conditionals\n  assert(1 ? 2 : 3 == 2);\n  assert(0 ? 2 : 3 == 3);\n}",
        modifiedCode: "void test_conditional() {\n  // Test valid conditionals\n  assert(1 ? 2 : 3 == 2);\n  assert(0 ? 2 : 3 == 3);\n  \n  // Test error cases\n  // The following should now cause compile errors:\n  // int x = 1 ? 2 : ;\n  // int y = 1 ? : 3;\n}",
        explanation: "Updated test cases to document the expected behavior for invalid conditional expressions."
      }
    ];
    
    mockPatches.forEach(patch => {
      // In a real implementation, this would be called by the AI after generating each patch
      // addGeneratedPatch(patch);
    });
    
    await simulateStep("validation", true, 3000, {
      summary: "Patches validated for correctness",
      details: "The proposed changes fix the issue by validating that an expression follows the colon in conditional expressions. Test cases have been updated to document the expected behavior.",
      codeSnippets: [
        {
          filePath: "src/parser.c",
          code: "// Validation test: This code now correctly errors on invalid conditionals\nint test_invalid_conditional() {\n  int x = 1 ? 2 : ; // Should error\n  return x;\n}",
          isError: true
        }
      ]
    });
    
    await simulateStep("integration", true, 2000);
    
    setIsRunning(false);
    setActiveTab("patches");
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
                    disabled={isRunning}
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
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
