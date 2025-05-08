
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import WorkflowSidebar from "./WorkflowSidebar";
import { Settings, LogOut } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  showSidebar = true 
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen">
      {showSidebar && <WorkflowSidebar />}
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-14 border-b border-border px-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold">Bug Whisperer AI</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
            
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{user.username}</span>
                <div className="h-8 w-8 rounded-full bg-muted overflow-hidden">
                  <img 
                    src={user.avatar}
                    alt={user.username}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
