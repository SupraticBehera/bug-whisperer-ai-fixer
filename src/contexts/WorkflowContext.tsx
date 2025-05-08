
import React, { createContext, useState, useContext } from "react";

export type WorkflowStatus = "pending" | "progress" | "success" | "error";

export interface WorkflowStep {
  id: string;
  name: string;
  status: WorkflowStatus;
  model: string;
  result?: {
    summary?: string;
    details?: string;
    codeSnippets?: CodeSnippet[];
    relatedFiles?: CodeFile[];
    rootCause?: string;
    solution?: string;
  };
  error?: string;
}

export interface CodeSnippet {
  code: string;
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
  isError?: boolean;
}

export interface CodeFile {
  path: string;
  content: string;
}

export interface Repository {
  owner: string;
  name: string;
  url: string;
  branch: string;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  body: string;
  url: string;
  labels: string[];
}

export interface CodePatch {
  filePath: string;
  originalCode: string;
  modifiedCode: string;
  explanation: string;
  impactedFiles?: string[];
}

interface WorkflowContextType {
  steps: WorkflowStep[];
  currentStep: string;
  repository: Repository | null;
  selectedIssue: Issue | null;
  generatedPatches: CodePatch[];
  setRepository: (repo: Repository) => void;
  setSelectedIssue: (issue: Issue) => void;
  startWorkflow: () => void;
  goToStep: (stepId: string) => void;
  updateStepStatus: (stepId: string, status: WorkflowStatus, result?: any, error?: string) => void;
  addGeneratedPatch: (patch: CodePatch) => void;
  resetWorkflow: () => void;
}

const initialSteps: WorkflowStep[] = [
  { id: "repo-analysis", name: "Repository Analysis", status: "pending", model: "Mistral-7B" },
  { id: "issue-context", name: "Issue Context Extraction", status: "pending", model: "Llama-3-8B" },
  { id: "code-understanding", name: "Code Understanding", status: "pending", model: "CodeLlama-13B" },
  { id: "root-cause", name: "Root Cause Analysis", status: "pending", model: "CodeLlama-70B" },
  { id: "patch-generation", name: "Patch Generation", status: "pending", model: "CodeLlama-70B" },
  { id: "validation", name: "Patch Validation", status: "pending", model: "DeepseekCoder-33B" },
  { id: "integration", name: "PR Integration", status: "pending", model: "Llama-3-8B" },
];

const WorkflowContext = createContext<WorkflowContextType>({
  steps: initialSteps,
  currentStep: "",
  repository: null,
  selectedIssue: null,
  generatedPatches: [],
  setRepository: () => {},
  setSelectedIssue: () => {},
  startWorkflow: () => {},
  goToStep: () => {},
  updateStepStatus: () => {},
  addGeneratedPatch: () => {},
  resetWorkflow: () => {},
});

export const useWorkflow = () => useContext(WorkflowContext);

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [steps, setSteps] = useState<WorkflowStep[]>(initialSteps);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [repository, setRepository] = useState<Repository | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [generatedPatches, setGeneratedPatches] = useState<CodePatch[]>([]);

  const startWorkflow = () => {
    // Reset steps to initial state
    setSteps(initialSteps.map(step => ({ ...step, status: "pending" })));
    setCurrentStep("repo-analysis");
    setGeneratedPatches([]);
    updateStepStatus("repo-analysis", "progress");
  };

  const goToStep = (stepId: string) => {
    setCurrentStep(stepId);
  };

  const updateStepStatus = (stepId: string, status: WorkflowStatus, result?: any, error?: string) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId 
          ? { ...step, status, result: result || step.result, error: error || step.error }
          : step
      )
    );

    // If current step is complete, automatically move to the next step
    if (status === "success") {
      const currentIndex = steps.findIndex(step => step.id === stepId);
      const nextStep = steps[currentIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep.id);
        // Set next step to in progress
        setSteps(prevSteps => 
          prevSteps.map(step => 
            step.id === nextStep.id 
              ? { ...step, status: "progress" }
              : step
          )
        );
      }
    }
  };

  const addGeneratedPatch = (patch: CodePatch) => {
    setGeneratedPatches(prev => [...prev, patch]);
  };

  const resetWorkflow = () => {
    setSteps(initialSteps);
    setCurrentStep("");
    setGeneratedPatches([]);
  };

  return (
    <WorkflowContext.Provider
      value={{
        steps,
        currentStep,
        repository,
        selectedIssue,
        generatedPatches,
        setRepository,
        setSelectedIssue,
        startWorkflow,
        goToStep,
        updateStepStatus,
        addGeneratedPatch,
        resetWorkflow,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};
