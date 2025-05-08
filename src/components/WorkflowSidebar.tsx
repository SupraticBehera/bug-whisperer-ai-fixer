
import React from "react";
import { useWorkflow, WorkflowStatus } from "@/contexts/WorkflowContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, X, Loader, Info, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const StatusIcon = ({ status }: { status: WorkflowStatus }) => {
  switch (status) {
    case "success":
      return <Check className="h-4 w-4" />;
    case "error":
      return <X className="h-4 w-4" />;
    case "progress":
      return <Loader className="h-4 w-4 animate-spin" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const WorkflowSidebar = () => {
  const { steps, currentStep, repository, selectedIssue, startWorkflow } = useWorkflow();

  const getStatusColor = (status: WorkflowStatus) => {
    switch (status) {
      case "success":
        return "bg-status-success";
      case "error":
        return "bg-status-error";
      case "progress":
        return "bg-status-progress";
      default:
        return "bg-status-pending";
    }
  };

  return (
    <div className="w-72 h-full bg-sidebar border-r border-border flex flex-col">
      <div className="p-4 flex items-center gap-2">
        <div className="bg-primary rounded-full p-1">
          <Info className="h-4 w-4 text-primary-foreground" />
        </div>
        <h2 className="font-semibold">Bug Whisperer AI</h2>
      </div>
      
      <Separator />
      
      <div className="p-4">
        <h3 className="text-sm font-medium mb-2">Project</h3>
        {repository ? (
          <div className="text-xs text-muted-foreground mb-2">
            <p>{repository.owner}/{repository.name}</p>
            <p className="mt-1">Branch: {repository.branch}</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-2">No repository connected</p>
        )}
        
        {selectedIssue && (
          <div className="text-xs bg-accent rounded-md p-2 mt-2">
            <span className="text-accent-foreground font-medium">Issue #{selectedIssue.number}</span>
            <p className="text-accent-foreground mt-1">{selectedIssue.title}</p>
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-sm font-medium mb-3">Workflow Progress</h3>
        
        <div className="relative">
          {/* Vertical line connecting steps */}
          <div className="absolute left-[11px] top-1 bottom-1 w-0.5 bg-muted" />
          
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={cn(
                "relative flex items-start mb-4 pl-7",
                currentStep === step.id ? "opacity-100" : "opacity-70"
              )}
            >
              {/* Status indicator */}
              <div 
                className={cn(
                  "absolute left-0 top-0.5 h-5 w-5 rounded-full border-2 border-background flex items-center justify-center",
                  getStatusColor(step.status)
                )}
              >
                <StatusIcon status={step.status} />
              </div>
              
              <div className="flex flex-col">
                <span className="text-xs font-medium">{step.name}</span>
                <span className="text-[10px] text-muted-foreground">Model: {step.model}</span>
                
                {step.status === "error" && (
                  <span className="text-[10px] text-status-error mt-1">{step.error || "An error occurred"}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-border">
        {currentStep ? (
          <div className="text-xs text-center text-muted-foreground mb-2">
            Workflow in progress
          </div>
        ) : (
          <Button 
            onClick={startWorkflow} 
            disabled={!repository || !selectedIssue}
            className="w-full"
            size="sm"
          >
            Start Analysis
          </Button>
        )}
      </div>
    </div>
  );
};

export default WorkflowSidebar;
