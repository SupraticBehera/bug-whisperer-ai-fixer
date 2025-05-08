
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkflow, Issue } from "@/contexts/WorkflowContext";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Tag, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchRepositoryIssues } from "@/utils/githubApi";

const IssueSelection = () => {
  const navigate = useNavigate();
  const { repository, setSelectedIssue } = useWorkflow();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fallback mock issues - only used if API fails
  const mockIssues: Issue[] = [
    {
      id: "issue-1",
      number: 42,
      title: "Login fails when username contains special characters",
      body: "When attempting to log in with a username that contains special characters like '@' or '&', the login process fails with a 400 error.",
      url: "https://github.com/org/repo/issues/42",
      labels: ["bug", "authentication", "priority-high"]
    },
    {
      id: "issue-2",
      number: 57,
      title: "Memory leak in rendering component",
      body: "The visualization component doesn't properly clean up resources, causing memory usage to grow over time when the component is mounted/unmounted repeatedly.",
      url: "https://github.com/org/repo/issues/57",
      labels: ["bug", "performance", "memory"]
    },
    {
      id: "issue-3",
      number: 103,
      title: "API pagination returns duplicate results",
      body: "When fetching paginated data from the API, some items appear in multiple pages, causing issues with data processing and display.",
      url: "https://github.com/org/repo/issues/103",
      labels: ["bug", "api", "pagination"]
    },
    {
      id: "issue-4",
      number: 128,
      title: "Race condition in concurrent data processing",
      body: "Multiple workers accessing the same data can create a race condition when updates happen concurrently, leading to data corruption.",
      url: "https://github.com/org/repo/issues/128",
      labels: ["bug", "concurrency", "data-integrity"]
    },
    {
      id: "issue-5",
      number: 156,
      title: "CSS layout breaks on mobile devices",
      body: "The navigation menu doesn't properly adjust on mobile devices, causing overflow and making some elements inaccessible.",
      url: "https://github.com/org/repo/issues/156",
      labels: ["bug", "ui", "responsive", "mobile"]
    }
  ];

  useEffect(() => {
    // Load issues from GitHub API
    const loadIssues = async () => {
      setIsLoading(true);
      try {
        if (repository) {
          // Fetch real issues from GitHub API
          const repoIssues = await fetchRepositoryIssues(repository);
          setIssues(repoIssues);
          setFilteredIssues(repoIssues);
          
          console.log("Fetched repository issues:", repoIssues);
        }
      } catch (error) {
        console.error("Failed to load issues:", error);
        toast({
          title: "Failed to load issues",
          description: "Using mock issues instead. Connect with valid GitHub credentials for real data.",
          variant: "destructive",
        });
        
        // Fallback to mock issues on error
        setIssues(mockIssues);
        setFilteredIssues(mockIssues);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (repository) {
      loadIssues();
    } else {
      navigate("/connect-repository");
    }
  }, [repository, navigate, toast]);
  
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredIssues(issues);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = issues.filter(issue => 
        issue.title.toLowerCase().includes(query) || 
        issue.body.toLowerCase().includes(query) ||
        issue.labels.some(label => label.toLowerCase().includes(query))
      );
      setFilteredIssues(filtered);
    }
  }, [searchQuery, issues]);
  
  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    toast({
      title: "Issue selected",
      description: `Selected issue #${issue.number}: ${issue.title}`,
    });
    navigate("/dashboard");
  };

  const getIssueTypeIcon = (labels: string[]) => {
    if (labels.includes("performance")) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Select an Issue</h1>
          <p className="text-muted-foreground mt-2">
            Choose an issue from {repository?.owner}/{repository?.name} to analyze and fix.
          </p>
        </div>
        
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 animate-pulse">
                    <div className="h-6 bg-muted rounded-md w-3/4 mb-4"></div>
                    <div className="h-4 bg-muted rounded-md w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded-md w-5/6"></div>
                    <div className="flex gap-2 mt-4">
                      <div className="h-6 bg-muted rounded-full w-16"></div>
                      <div className="h-6 bg-muted rounded-full w-20"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">No issues found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <Card 
                key={issue.id}
                className="overflow-hidden hover:border-primary transition-colors cursor-pointer"
                onClick={() => handleSelectIssue(issue)}
              >
                <CardContent className="p-0">
                  <div className="flex items-start p-4 gap-4">
                    <div className="mt-1">
                      {getIssueTypeIcon(issue.labels)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">#{issue.number}</span>
                        <h3 className="font-medium">{issue.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {issue.body}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {issue.labels.map((label, i) => {
                          // Determine badge color based on label
                          let variant: "default" | "secondary" | "outline" = "outline";
                          if (label === "bug") variant = "default";
                          else if (label.includes("priority") || label === "performance") variant = "secondary";
                          
                          return (
                            <Badge 
                              key={i} 
                              variant={variant}
                              className={cn(
                                "text-xs",
                                label === "bug" && "bg-red-500/20 text-red-500 hover:bg-red-500/30",
                                label.includes("priority") && "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30",
                                label === "performance" && "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30"
                              )}
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {label}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default IssueSelection;
