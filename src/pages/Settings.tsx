
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

type LLMModel = {
  id: string;
  name: string;
  task: string;
  size: string;
  provider: "ollama" | "huggingface" | "openai";
};

const models: LLMModel[] = [
  { id: "mistral-7b", name: "Mistral 7B", task: "Repository Analysis", size: "7B", provider: "ollama" },
  { id: "llama3-8b", name: "Llama 3 8B", task: "Issue Context Extraction", size: "8B", provider: "ollama" },
  { id: "codellama-13b", name: "CodeLlama 13B", task: "Code Understanding", size: "13B", provider: "ollama" },
  { id: "codellama-70b", name: "CodeLlama 70B", task: "Root Cause Analysis & Patch Generation", size: "70B", provider: "ollama" },
  { id: "deepseek-33b", name: "DeepSeek Coder 33B", task: "Validation", size: "33B", provider: "ollama" },
  { id: "codellama-7b", name: "CodeLlama 7B", task: "", size: "7B", provider: "huggingface" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", task: "", size: "unknown", provider: "openai" },
  { id: "gpt-4", name: "GPT-4", task: "", size: "unknown", provider: "openai" },
];

const Settings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("models");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [githubToken, setGithubToken] = useState("");
  const [codeStyle, setCodeStyle] = useState("auto");
  
  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure Bug Whisperer AI to match your preferences.
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="models">AI Models</TabsTrigger>
            <TabsTrigger value="github">GitHub Integration</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="models">
            <Card>
              <CardHeader>
                <CardTitle>AI Model Configuration</CardTitle>
                <CardDescription>
                  Configure which models to use for different stages of the bug resolution workflow.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {["Repository Analysis", "Issue Context Extraction", "Code Understanding", 
                      "Root Cause Analysis", "Patch Generation", "Validation", "Integration"].map((task, i) => (
                      <div key={i} className="space-y-2">
                        <Label htmlFor={`task-${i}`}>{task}</Label>
                        <Select defaultValue={models.find(m => m.task.includes(task))?.id || "auto"}>
                          <SelectTrigger id={`task-${i}`}>
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto (Recommended)</SelectItem>
                            {models.filter(m => m.provider === "ollama").map(model => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name} ({model.size})
                              </SelectItem>
                            ))}
                            <Separator className="my-2" />
                            <span className="text-xs text-muted-foreground px-2 py-1">Fallback Options</span>
                            {models.filter(m => m.provider !== "ollama").map(model => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name} - {model.provider}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="font-medium">Model Providers</h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Use Ollama (Local) Models</Label>
                        <p className="text-sm text-muted-foreground">
                          Use locally hosted models with Ollama (recommended)
                        </p>
                      </div>
                      <Switch checked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Use Hugging Face Models</Label>
                        <p className="text-sm text-muted-foreground">
                          Use Hugging Face models as fallback when needed
                        </p>
                      </div>
                      <Switch checked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Use OpenAI API</Label>
                        <p className="text-sm text-muted-foreground">
                          Use OpenAI models as last resort fallback (free tier only)
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveSettings}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="github">
            <Card>
              <CardHeader>
                <CardTitle>GitHub Integration</CardTitle>
                <CardDescription>
                  Configure your GitHub integration settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="github-token">Personal Access Token</Label>
                    <Input 
                      id="github-token" 
                      type="password" 
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Token requires repo and issues permissions
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="font-medium">Pull Request Settings</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pr-title-template">PR Title Template</Label>
                      <Input 
                        id="pr-title-template" 
                        defaultValue="Fix: {issue.title}" 
                      />
                      <p className="text-sm text-muted-foreground">
                        You can use {'{issue.number}'}, {'{issue.title}'}, and {'{repo.name}'} as variables
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-Create Pull Requests</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically create PRs when fixes are validated
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveSettings}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>User Preferences</CardTitle>
                <CardDescription>
                  Customize your experience and code style preferences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-medium">Code Style</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="code-style">Default Code Style</Label>
                      <Select 
                        value={codeStyle}
                        onValueChange={setCodeStyle}
                      >
                        <SelectTrigger id="code-style">
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto (Detect from repo)</SelectItem>
                          <SelectItem value="google">Google Style</SelectItem>
                          <SelectItem value="airbnb">Airbnb Style</SelectItem>
                          <SelectItem value="standard">StandardJS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tabs-spaces">Indentation</Label>
                        <Select defaultValue="2">
                          <SelectTrigger id="tabs-spaces">
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 Spaces</SelectItem>
                            <SelectItem value="4">4 Spaces</SelectItem>
                            <SelectItem value="tab">Tabs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="line-endings">Line Endings</Label>
                        <Select defaultValue="auto">
                          <SelectTrigger id="line-endings">
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto (Detect from repo)</SelectItem>
                            <SelectItem value="lf">LF (Unix)</SelectItem>
                            <SelectItem value="crlf">CRLF (Windows)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="font-medium">UI Preferences</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Dependency Graphs</Label>
                        <p className="text-sm text-muted-foreground">
                          Display code dependency visualizations during analysis
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Model Details</Label>
                        <p className="text-sm text-muted-foreground">
                          Display which AI model is used for each step
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveSettings}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how you'll be notified during the bug resolution process.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications for important events
                      </p>
                    </div>
                    <Switch 
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="font-medium">Notification Events</h3>
                    
                    <div className="flex items-center justify-between">
                      <Label>When analysis is complete</Label>
                      <Switch defaultChecked disabled={!notificationsEnabled} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>When fix is generated</Label>
                      <Switch defaultChecked disabled={!notificationsEnabled} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>When validation fails</Label>
                      <Switch defaultChecked disabled={!notificationsEnabled} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>When PR is created</Label>
                      <Switch defaultChecked disabled={!notificationsEnabled} />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="font-medium">Analytics</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Share Anonymous Usage Data</Label>
                        <p className="text-sm text-muted-foreground">
                          Help us improve by sharing anonymous usage statistics
                        </p>
                      </div>
                      <Switch 
                        checked={analyticsEnabled}
                        onCheckedChange={setAnalyticsEnabled}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveSettings}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
