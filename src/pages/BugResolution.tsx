import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, AlertTriangle, FileCode, GitBranch, GitPullRequest } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

  // Mock function to simulate the AI workflow
  const runWorkflow = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    startWorkflow();
    
    // Simulate the workflow steps with delays
    const simulateStep = async (stepId: string, success: boolean = true, delay: number = 3000) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (success) {
        updateStepStatus(stepId, "success", { 
          summary: `Successfully completed ${stepId}`,
          details: `This is a detailed explanation of what happened during the ${stepId} step.`
        });
      } else {
        updateStepStatus(stepId, "error", undefined, "An error occurred during this step.");
      }
    };
    
    // Simulate each step in sequence
    await simulateStep("repo-analysis");
    await simulateStep("issue-context");
    await simulateStep("code-understanding");
    await simulateStep("root-cause");
    
    // Generate mock patches
    await simulateStep("patch-generation");
    
    // Add mock patches
    const mockPatches = [
      {
        filePath: "src/components/auth/LoginForm.js",
        originalCode: "function validateUsername(username) {\n  return username.length >= 3;\n}",
        modifiedCode: "function validateUsername(username) {\n  if (!username) return false;\n  return username.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username);\n}",
        explanation: "Added null check and special character validation to prevent the login error when usernames contain special characters."
      },
      {
        filePath: "src/api/authService.js",
        originalCode: "export async function login(username, password) {\n  const response = await api.post('/auth/login', { username, password });\n  return response.data;\n}",
        modifiedCode: "export async function login(username, password) {\n  const encodedUsername = encodeURIComponent(username);\n  const response = await api.post('/auth/login', { username: encodedUsername, password });\n  return response.data;\n}",
        explanation: "Added URL encoding for the username to handle special characters properly when sending to the API."
      }
    ];
    
    mockPatches.forEach(patch => {
      // In a real implementation, this would be called by the AI after generating each patch
      // addGeneratedPatch(patch);
    });
    
    await simulateStep("validation");
    await simulateStep("integration");
    
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
                <TabsTrigger value="progress">Analysis Progress</TabsTrigger>
                <TabsTrigger value="patches">Generated Patches</TabsTrigger>
                <TabsTrigger value="pr">Pull Request</TabsTrigger>
              </TabsList>
              
              <TabsContent value="progress" className="space-y-4">
                {steps.map((step) => (
                  step.status !== "pending" && (
                    <Card key={step.id}>
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
                          <div>
                            <p className="font-medium">{step.result.summary}</p>
                            <p className="text-sm text-muted-foreground mt-2">{step.result.details}</p>
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
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Original Code</h4>
                              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                                {patch.originalCode}
                              </pre>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-2">Modified Code</h4>
                              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                                {patch.modifiedCode}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </CardContent>
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
