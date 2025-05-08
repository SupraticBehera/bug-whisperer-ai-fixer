
import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { Github, GitBranch, Bug, FileCode, ArrowRight, Play } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { repository, selectedIssue } = useWorkflow();

  // Mock recent repositories
  const recentRepositories = [
    { owner: "user", name: "example-repo", stars: 42, issues: 5 },
    { owner: "organization", name: "another-repo", stars: 128, issues: 12 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to Bug Whisperer AI. Start by connecting a repository and selecting an issue to fix.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={repository ? "border-status-success" : "border-border"}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                Connect Repository
              </CardTitle>
              <CardDescription>
                Link your GitHub repository
              </CardDescription>
            </CardHeader>
            <CardContent>
              {repository ? (
                <div className="text-sm space-y-2">
                  <p className="font-medium">{repository.owner}/{repository.name}</p>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    <span>{repository.branch}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => navigate("/connect-repository")}
                  >
                    Change Repository
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => navigate("/connect-repository")}
                >
                  Connect Now
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className={selectedIssue ? "border-status-success" : "border-border"}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Select Issue
              </CardTitle>
              <CardDescription>
                Choose an issue to analyze and fix
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedIssue ? (
                <div className="text-sm space-y-2">
                  <p className="font-medium">#{selectedIssue.number}: {selectedIssue.title}</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedIssue.labels.map((label, i) => (
                      <span 
                        key={i}
                        className="px-2 py-0.5 rounded-full text-xs bg-muted"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => navigate("/select-issue")}
                  >
                    Change Issue
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => navigate("/select-issue")}
                  disabled={!repository}
                >
                  Select Issue
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Start Resolution
              </CardTitle>
              <CardDescription>
                Begin AI analysis and bug fixing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => navigate(selectedIssue ? `/resolve/${selectedIssue.id}` : "#")}
                disabled={!repository || !selectedIssue}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Analysis
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Repositories</h2>
          <div className="space-y-4">
            {recentRepositories.map((repo, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Github className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{repo.owner}/{repo.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>⭐ {repo.stars}</span>
                        <span>🐛 {repo.issues} open issues</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
