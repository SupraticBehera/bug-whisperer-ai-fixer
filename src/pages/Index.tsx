
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent flex flex-col">
      <header className="container py-6 flex justify-between items-center">
        <div className="font-bold text-xl">Bug Whisperer AI</div>
        <nav>
          <Button variant="ghost" onClick={() => navigate("/auth")}>
            Login
          </Button>
        </nav>
      </header>

      <main className="container flex-1 flex flex-col md:flex-row items-center justify-center gap-12 py-10">
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            AI-Powered Bug Resolution
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Connect your GitHub repository and let our advanced AI analyze, fix, and create pull requests for your code issues.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>

        <div className="md:w-1/2 p-6 rounded-lg border border-border shadow-xl bg-card">
          <div className="aspect-video rounded-md overflow-hidden bg-muted flex items-center justify-center">
            {/* This would be a demo video or animation in the real app */}
            <div className="text-center p-8">
              <h3 className="text-xl font-medium mb-2">Workflow Demonstration</h3>
              <p className="text-muted-foreground mb-4">
                See how Bug Whisperer AI analyzes and fixes issues in your codebase.
              </p>
              <div className="flex flex-col gap-2">
                <div className="h-2 bg-status-pending rounded-full w-full"></div>
                <div className="h-2 bg-status-progress animate-pulse rounded-full w-3/4"></div>
                <div className="h-2 bg-status-success rounded-full w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="container py-6 border-t border-border flex flex-col md:flex-row justify-between items-center">
        <div className="text-sm text-muted-foreground">
          &copy; 2025 Bug Whisperer AI. All rights reserved.
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">About</a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
