
import { Repository, Issue } from "@/contexts/WorkflowContext";

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
