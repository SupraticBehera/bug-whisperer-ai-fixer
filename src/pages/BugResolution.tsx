
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useWorkflow, WorkflowStatus } from "@/contexts/WorkflowContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileCode, GitPullRequest, Check, X } from "lucide-react";

// Simple mock code editor component
const CodeEditor = ({ code, readOnly = false }: { code: string, readOnly?: boolean }) => {
  return (
    <pre className={`p-4 rounded-md bg-card border text-sm font-mono overflow-auto ${readOnly ? 'opacity-80' : ''}`}>
      {code}
    </pre>
  );
};

// Mock dependency graph component
const DependencyGraph = () => {
  return (
    <div className="w-full h-64 bg-card border rounded-md flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <p>Dependency Graph Visualization</p>
        <p className="text-sm">(Using React Flow or D3.js in the final implementation)</p>
      </div>
    </div>
  );
};

const BugResolution = () => {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { repository, selectedIssue, steps, startWorkflow, updateStepStatus, generatedPatches, addGeneratedPatch } = useWorkflow();
  
  const [activeTab, setActiveTab] = useState("analysis");
  
  // Mock code samples
  const mockBuggyCode = `function processUserData(user) {
  // Bug: doesn't check if user.settings exists before accessing
  const userPreferences = user.settings.preferences;
  
  if (userPreferences.theme) {
    return {
      theme: userPreferences.theme,
      notifications: userPreferences.notifications || 'all'
    };
  }
  
  return {
    theme: 'default',
    notifications: 'all'
  };
}`;

  const mockFixedCode = `function processUserData(user) {
  // Fixed: Added proper checks to avoid accessing undefined
  const userSettings = user.settings || {};
  const userPreferences = userSettings.preferences || {};
  
  if (userPreferences.theme) {
    return {
      theme: userPreferences.theme,
      notifications: userPreferences.notifications || 'all'
    };
  }
  
  return {
    theme: 'default',
    notifications: 'all'
  };
}`;

  useEffect(() => {
    if (!repository || !selectedIssue) {
      navigate("/dashboard");
      return;
    }
    
    // Start the workflow when the component mounts
    startWorkflow();
    
    // Simulate the workflow steps
    const simulateWorkflow = async () => {
      try {
        // Repository Analysis
        await new Promise(r => setTimeout(r, 2000));
        updateStepStatus("repo-analysis", "success", { 
          fileCount: 42,
          relevantFiles: ["user.js", "settings.js", "preferences.js"]
        });
        
        // Issue Context Extraction
        await new Promise(r => setTimeout(r, 1500));
        updateStepStatus("issue-context", "success", {
          issueType: "NullPointerException",
          affectedFeature: "User Preferences",
          commonPatterns: ["Missing null checks", "Undefined property access"]
        });
        
        // Code Understanding
        await new Promise(r => setTimeout(r, 3000));
        updateStepStatus("code-understanding", "success", {
          codeMap: {
            "user.js": ["processUserData", "getUserPreferences"],
            "settings.js": ["loadSettings", "applyTheme"]
          },
          dependencies: {
            "processUserData": ["getUserPreferences", "applyTheme"]
          }
        });
        
        // Root Cause Analysis
        await new Promise(r => setTimeout(r, 2500));
        updateStepStatus("root-cause", "success", {
          file: "user.js",
          function: "processUserData",
          line: 3,
          issue: "Accessing properties on potentially undefined object",
          confidence: 0.92
        });
        
        // Patch Generation
        await new Promise(r => setTimeout(r, 3000));
        const patch = {
          filePath: "src/user.js",
          originalCode: mockBuggyCode,
          modifiedCode: mockFixedCode,
          explanation: "Added null/undefined checks to prevent accessing properties on undefined objects. This ensures the code handles cases where user.settings is not defined or doesn't have a preferences property."
        };
        addGeneratedPatch(patch);
        updateStepStatus("patch-generation", "success", { patch });
        
        // Validation
        await new Promise(r => setTimeout(r, 2000));
        updateStepStatus("validation", "success", {
          tests: [
            { name: "Test with undefined settings", result: "pass" },
            { name: "Test with null preferences", result: "pass" },
            { name: "Test with complete user object", result: "pass" }
          ],
          staticAnalysis: "No issues found",
          overallScore: 0.97
        });
        
        // PR Integration
        await new Promise(r => setTimeout(r, 1500));
        updateStepStatus("integration", "success", {
          prNumber: 143,
          prUrl: `https://github.com/${repository?.owner}/${repository?.name}/pull/143`,
          commits: 1,
          changedFiles: 1
        });
        
        toast({
          title: "Bug resolution complete",
          description: "The fix has been validated and a PR has been created.",
        });
      } catch (error) {
        console.error("Workflow simulation error:", error);
        toast({
          title: "Workflow error",
          description: "An error occurred during the bug resolution process.",
          variant: "destructive",
        });
      }
    };
    
    simulateWorkflow();
  }, []);
  
  // Helper to get a step by id
  const getStep = (id: string) => steps.find(step => step.id === id);
  
  const getRootCauseAnalysis = () => {
    const step = getStep("root-cause");
    return step?.result || null;
  };
  
  const getValidationResults = () => {
    const step = getStep("validation");
    return step?.result || null;
  };

  const handleCreatePR = () => {
    toast({
      title: "Creating Pull Request",
      description: "Submitting changes to GitHub...",
    });
    
    // In a real app, this would call the GitHub API to create a PR
    setTimeout(() => {
      toast({
        title: "Pull Request Created",
        description: `PR #143 created in ${repository?.owner}/${repository?.name}`,
      });
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bug Resolution</h1>
          <p className="text-muted-foreground mt-2">
            {selectedIssue ? `Fixing issue #${selectedIssue.number}: ${selectedIssue.title}` : 'Analyzing and fixing the selected issue'}
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="patches">Patches</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              <TabsTrigger value="integration">Integration</TabsTrigger>
            </TabsList>
            
            <Button 
              onClick={handleCreatePR}
              disabled={getStep("validation")?.status !== "success"}
            >
              <GitPullRequest className="h-4 w-4 mr-2" />
              Create PR
            </Button>
          </div>
          
          <div className="mt-6">
            <TabsContent value="analysis">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Root Cause Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getStep("root-cause")?.status === "progress" ? (
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-muted rounded-md w-3/4"></div>
                        <div className="h-4 bg-muted rounded-md w-full"></div>
                        <div className="h-4 bg-muted rounded-md w-5/6"></div>
                      </div>
                    ) : getRootCauseAnalysis() ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-muted-foreground">File:</div>
                          <div>{getRootCauseAnalysis().file}</div>
                          
                          <div className="text-muted-foreground">Function:</div>
                          <div>{getRootCauseAnalysis().function}</div>
                          
                          <div className="text-muted-foreground">Line:</div>
                          <div>{getRootCauseAnalysis().line}</div>
                          
                          <div className="text-muted-foreground">Issue:</div>
                          <div>{getRootCauseAnalysis().issue}</div>
                          
                          <div className="text-muted-foreground">Confidence:</div>
                          <div>{(getRootCauseAnalysis().confidence * 100).toFixed(1)}%</div>
                        </div>
                        
                        <div className="pt-4">
                          <h4 className="text-sm font-medium mb-2">Buggy Code</h4>
                          <CodeEditor code={mockBuggyCode} readOnly />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        Waiting for analysis to complete...
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Code Dependencies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DependencyGraph />
                    
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-2">Affected Components</h4>
                      {getStep("code-understanding")?.status === "success" ? (
                        <ul className="text-sm space-y-1">
                          {Object.entries(getStep("code-understanding")?.result?.codeMap || {}).map(([file, funcs], i) => (
                            <li key={i} className="flex items-center gap-2">
                              <FileCode className="h-4 w-4 text-muted-foreground" />
                              <span>{file}: {Array.isArray(funcs) ? funcs.join(", ") : funcs}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="animate-pulse space-y-2">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-4 bg-muted rounded-md w-full"></div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="patches">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generated Patch</CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedPatches.length > 0 ? (
                    <div className="space-y-6">
                      {generatedPatches.map((patch, i) => (
                        <div key={i} className="space-y-4">
                          <div className="text-sm">
                            <span className="text-muted-foreground">File: </span>
                            <span className="font-medium">{patch.filePath}</span>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Explanation</h4>
                            <p className="text-sm text-muted-foreground">{patch.explanation}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Original Code</h4>
                              <CodeEditor code={patch.originalCode} readOnly />
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium mb-2">Modified Code</h4>
                              <CodeEditor code={patch.modifiedCode} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : getStep("patch-generation")?.status === "progress" ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-muted rounded-md w-1/2"></div>
                      <div className="h-32 bg-muted rounded-md w-full"></div>
                      <div className="h-4 bg-muted rounded-md w-3/4"></div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Waiting for patch generation to complete...
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="validation">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Patch Validation</CardTitle>
                </CardHeader>
                <CardContent>
                  {getStep("validation")?.status === "success" ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-accent rounded-md p-4">
                          <h4 className="text-sm font-medium mb-3">Test Results</h4>
                          <ul className="space-y-2">
                            {getValidationResults().tests.map((test: any, i: number) => (
                              <li key={i} className="flex items-center justify-between text-sm">
                                <span>{test.name}</span>
                                {test.result === "pass" ? (
                                  <span className="text-status-success flex items-center">
                                    <Check className="h-4 w-4 mr-1" /> Pass
                                  </span>
                                ) : (
                                  <span className="text-status-error flex items-center">
                                    <X className="h-4 w-4 mr-1" /> Fail
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="bg-accent rounded-md p-4">
                          <h4 className="text-sm font-medium mb-3">Static Analysis</h4>
                          <p className="text-sm">{getValidationResults().staticAnalysis}</p>
                          
                          <div className="mt-6">
                            <h4 className="text-sm font-medium mb-2">Overall Score</h4>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-status-success h-2 rounded-full" 
                                style={{ width: `${getValidationResults().overallScore * 100}%` }}
                              />
                            </div>
                            <div className="text-right text-sm mt-1">
                              {(getValidationResults().overallScore * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : getStep("validation")?.status === "progress" ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-muted rounded-md w-1/2"></div>
                      <div className="h-32 bg-muted rounded-md w-full"></div>
                      <div className="h-4 bg-muted rounded-md w-3/4"></div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Waiting for validation to complete...
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="integration">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pull Request Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  {getStep("integration")?.status === "success" ? (
                    <div className="space-y-6">
                      <div className="border border-border rounded-md p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">
                              Fix issue #{selectedIssue?.number}: {selectedIssue?.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              PR #{getStep("integration")?.result?.prNumber} - Created just now
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <GitPullRequest className="h-4 w-4 mr-2" />
                            View PR
                          </Button>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div className="text-sm">
                          <p className="font-medium">Changes:</p>
                          <ul className="mt-2 space-y-1 text-muted-foreground">
                            <li>• Modified user.js: Added null/undefined checks</li>
                            <li>• Updated function processUserData</li>
                          </ul>
                        </div>
                        
                        <div className="mt-4 bg-muted p-3 rounded-md text-sm">
                          <p>
                            This PR addresses the issue where accessing properties on undefined objects
                            causes runtime errors. The fix adds proper null checks to ensure we don't
                            access properties on undefined objects.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : getStep("integration")?.status === "progress" ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-muted rounded-md w-3/4"></div>
                      <div className="h-4 bg-muted rounded-md w-1/2"></div>
                      <div className="h-32 bg-muted rounded-md w-full"></div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Waiting for integration to complete...
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default BugResolution;
