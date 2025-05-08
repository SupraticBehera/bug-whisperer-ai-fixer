
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { useToast } from "@/hooks/use-toast";
import { Search, Github } from "lucide-react";

const RepositoryConnect = () => {
  const navigate = useNavigate();
  const { setRepository } = useWorkflow();
  const { toast } = useToast();
  
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock repositories for demo
  const recentRepositories = [
    { owner: "facebook", name: "react", description: "A JavaScript library for building user interfaces", stars: 203000, branch: "main" },
    { owner: "microsoft", name: "vscode", description: "Visual Studio Code", stars: 143000, branch: "main" },
    { owner: "vercel", name: "next.js", description: "The React Framework for Production", stars: 98000, branch: "canary" },
  ];

  const handleConnect = async () => {
    setIsLoading(true);
    
    try {
      // Regex to extract owner and repo name from GitHub URL
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      
      if (!match || !match[1] || !match[2]) {
        toast({
          title: "Invalid repository URL",
          description: "Please enter a valid GitHub repository URL",
          variant: "destructive",
        });
        return;
      }
      
      const owner = match[1];
      const name = match[2].replace(/\.git$/, "");
      
      // In a real implementation, we would verify the repository exists
      // and the user has access to it
      
      setRepository({
        owner,
        name,
        url: `https://github.com/${owner}/${name}`,
        branch: "main", // Default to main
      });
      
      toast({
        title: "Repository connected",
        description: `Connected to ${owner}/${name}`,
      });
      
      navigate("/select-issue");
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect to repository. Please try again.",
        variant: "destructive",
      });
      console.error("Repository connect error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRepository = (owner: string, name: string, branch: string) => {
    setRepository({
      owner,
      name,
      url: `https://github.com/${owner}/${name}`,
      branch,
    });
    
    toast({
      title: "Repository connected",
      description: `Connected to ${owner}/${name}`,
    });
    
    navigate("/select-issue");
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Connect Repository</h1>
          <p className="text-muted-foreground mt-2">
            Link your GitHub repository to start fixing bugs with AI.
          </p>
        </div>
        
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="repo-url">GitHub Repository URL</Label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="repo-url"
                    placeholder="https://github.com/username/repository"
                    className="pl-10"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the URL of your GitHub repository
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleConnect}
                  disabled={isLoading || !repoUrl.trim()}
                >
                  {isLoading ? "Connecting..." : "Connect Repository"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Recent Repositories</h2>
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          
          <div className="space-y-4">
            {recentRepositories.map((repo, i) => (
              <Card key={i} className="hover:border-primary cursor-pointer transition-colors">
                <CardContent 
                  className="p-4 flex items-center justify-between"
                  onClick={() => handleSelectRepository(repo.owner, repo.name, repo.branch)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Github className="h-5 w-5 text-muted-foreground" />
                      <p className="font-medium">{repo.owner}/{repo.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{repo.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        ⭐ {repo.stars.toLocaleString()}
                      </span>
                      <span className="flex items-center">
                        <GitBranch className="h-3 w-3 mr-1" />
                        {repo.branch}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Select</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Add the GitBranch component since it's used above
const GitBranch = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="6" y1="3" x2="6" y2="15"></line>
    <circle cx="18" cy="6" r="3"></circle>
    <circle cx="6" cy="18" r="3"></circle>
    <path d="M18 9a9 9 0 0 1-9 9"></path>
  </svg>
);

export default RepositoryConnect;
