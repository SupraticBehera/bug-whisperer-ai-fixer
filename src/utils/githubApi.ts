
import { Repository, Issue, CodeFile } from "@/contexts/WorkflowContext";

// GitHub API base URL
const BASE_URL = "https://api.github.com";

// Function to fetch repository issues
export async function fetchRepositoryIssues(repository: Repository): Promise<Issue[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/repos/${repository.owner}/${repository.name}/issues?state=open&sort=created&direction=desc`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          // Add GitHub token header if available from user settings
          // "Authorization": `token ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform GitHub API response to our Issue format
    return data.map((issue: any) => ({
      id: issue.id.toString(),
      number: issue.number,
      title: issue.title,
      body: issue.body || "",
      url: issue.html_url,
      labels: issue.labels.map((label: any) => label.name)
    }));
  } catch (error) {
    console.error("Error fetching repository issues:", error);
    throw error;
  }
}

// Function to fetch file content from a repository
export async function fetchFileContent(repository: Repository, filePath: string, branch?: string): Promise<string> {
  try {
    const branchName = branch || repository.branch || "main";
    const response = await fetch(
      `${BASE_URL}/repos/${repository.owner}/${repository.name}/contents/${filePath}?ref=${branchName}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          // "Authorization": `token ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    
    // GitHub API returns file content as base64 encoded
    return atob(data.content);
  } catch (error) {
    console.error(`Error fetching file content for ${filePath}:`, error);
    throw error;
  }
}

// Function to get related files for a particular file
export async function findRelatedFiles(
  repository: Repository, 
  filePath: string,
  searchTerm: string = ""
): Promise<CodeFile[]> {
  try {
    // For a real implementation, you might want to use GitHub's search API
    // or a more sophisticated approach to find related files
    // This is a simplified example that returns mock data
    
    // In a full implementation, you would:
    // 1. Use GitHub's search API to find files that reference the file in question
    // 2. Parse imports/requires in the file to find dependencies
    // 3. Look for files in the same directory or with similar names

    // Mock implementation for now
    const fileExtension = filePath.split('.').pop() || '';
    const fileName = filePath.split('/').pop() || '';
    const fileNameWithoutExtension = fileName.replace(`.${fileExtension}`, '');
    
    // Mock related files
    const mockRelatedFiles: CodeFile[] = [
      {
        path: filePath.replace(`.${fileExtension}`, `.test.${fileExtension}`),
        content: "// Test file content would be fetched from GitHub"
      },
      {
        path: filePath.replace(fileName, `${fileNameWithoutExtension}.types.ts`),
        content: "// Types file content would be fetched from GitHub"
      }
    ];
    
    // In a real implementation, fetch the actual content for each file
    return mockRelatedFiles;
  } catch (error) {
    console.error(`Error finding related files for ${filePath}:`, error);
    return [];
  }
}
