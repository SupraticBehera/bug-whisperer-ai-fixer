
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Github } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleGithubLogin = async () => {
    setIsAuthenticating(true);
    try {
      // In a real implementation, we would redirect to GitHub OAuth
      // For demo, we'll simulate authentication with a mock code
      await login("mock-github-code");
      toast({
        title: "Authentication successful",
        description: "You have been logged in successfully.",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: "There was an error logging you in. Please try again.",
        variant: "destructive",
      });
      console.error("Auth error:", error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg border border-border">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in to Bug Whisperer</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect with GitHub to start fixing bugs with AI
          </p>
        </div>

        <div className="space-y-4">
          <Button
            className="w-full"
            onClick={handleGithubLogin}
            disabled={isAuthenticating}
          >
            <Github className="w-4 h-4 mr-2" />
            {isAuthenticating ? "Signing in..." : "Sign in with GitHub"}
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="#" className="underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline">
              Privacy Policy
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
