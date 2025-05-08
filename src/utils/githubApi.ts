
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

// Function to search code in a repository
export async function searchRepositoryCode(repository: Repository, query: string): Promise<{filePath: string, url: string}[]> {
  try {
    // Format the query with repo context
    const formattedQuery = `${query} repo:${repository.owner}/${repository.name}`;
    
    const response = await fetch(
      `${BASE_URL}/search/code?q=${encodeURIComponent(formattedQuery)}&per_page=30`,
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
    
    // Return a list of file paths and URLs
    return data.items.map((item: any) => ({
      filePath: item.path,
      url: item.html_url
    }));
  } catch (error) {
    console.error("Error searching repository code:", error);
    return [];
  }
}

// Function to recursively get file list from a repository directory
export async function fetchRepositoryFiles(repository: Repository, path: string = "", branch?: string): Promise<string[]> {
  try {
    const branchName = branch || repository.branch || "main";
    const response = await fetch(
      `${BASE_URL}/repos/${repository.owner}/${repository.name}/contents/${path}?ref=${branchName}`,
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
    let files: string[] = [];

    // If data is an array, it's a directory
    if (Array.isArray(data)) {
      // Process each item in the directory
      for (const item of data) {
        if (item.type === "file") {
          files.push(item.path);
        } else if (item.type === "dir") {
          // Recursively get files from subdirectories
          const subFiles = await fetchRepositoryFiles(repository, item.path, branchName);
          files = [...files, ...subFiles];
        }
      }
    } else if (data.type === "file") {
      // If data is a single object, it's a file
      files.push(data.path);
    }

    return files;
  } catch (error) {
    console.error(`Error fetching repository files for ${path}:`, error);
    return [];
  }
}

// Function to get related files for a particular file
export async function findRelatedFiles(
  repository: Repository, 
  filePath: string,
  searchTerm: string = ""
): Promise<CodeFile[]> {
  try {
    // Get files that might reference the target file
    const potentiallyRelatedFiles = await searchRepositoryCode(repository, filePath);
    
    // Fetch content for each potentially related file
    const relatedFiles: CodeFile[] = [];
    
    for (const file of potentiallyRelatedFiles) {
      if (file.filePath !== filePath) { // Skip the original file
        try {
          const content = await fetchFileContent(repository, file.filePath);
          relatedFiles.push({
            path: file.filePath,
            content
          });
        } catch (error) {
          console.error(`Error fetching content for ${file.filePath}:`, error);
        }
      }
    }
    
    // Also look for files that may be related by naming convention
    const fileExtension = filePath.split('.').pop() || '';
    const fileName = filePath.split('/').pop() || '';
    const fileNameWithoutExtension = fileName.replace(`.${fileExtension}`, '');
    
    // Look for test files, type files, etc.
    const conventionRelatedPatterns = [
      filePath.replace(`.${fileExtension}`, `.test.${fileExtension}`),
      filePath.replace(`.${fileExtension}`, `.spec.${fileExtension}`),
      filePath.replace(fileName, `${fileNameWithoutExtension}.types.ts`),
      filePath.replace(fileName, `${fileNameWithoutExtension}.d.ts`),
    ];
    
    for (const pattern of conventionRelatedPatterns) {
      try {
        const content = await fetchFileContent(repository, pattern);
        relatedFiles.push({
          path: pattern,
          content
        });
      } catch (error) {
        // This is expected for files that don't exist
      }
    }
    
    return relatedFiles;
  } catch (error) {
    console.error(`Error finding related files for ${filePath}:`, error);
    return [];
  }
}

// Function to find files likely related to a specific bug based on issue content
export async function findFilesForBugAnalysis(
  repository: Repository, 
  issue: Issue
): Promise<{filePaths: string[], fileContents: Record<string, string>}> {
  try {
    // Extract potential keywords from issue title and body
    const issueText = `${issue.title} ${issue.body}`;
    
    // Extract potential file extensions, class names, function names, variable names
    const codeIdentifierRegex = /\b[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*\b/g;
    const potentialIdentifiers = [...new Set([
      ...issueText.match(codeIdentifierRegex) || [],
      ...issue.labels
    ])];
    
    // Extract potential file paths (anything that looks like a path)
    const filePathRegex = /\b[\w-]+\.(js|jsx|ts|tsx|css|html|json|md|py|java|rb|go|rs|c|cpp|h|hpp)\b/g;
    const potentialFilePaths = [...new Set(issueText.match(filePathRegex) || [])];
    
    // Search for each potential identifier
    let allFilePaths: Set<string> = new Set();
    
    // First try with potential file paths
    for (const path of potentialFilePaths) {
      try {
        const content = await fetchFileContent(repository, path);
        allFilePaths.add(path);
      } catch (error) {
        // File probably doesn't exist, try searching for it
        const searchResults = await searchRepositoryCode(repository, path);
        searchResults.forEach(result => allFilePaths.add(result.filePath));
      }
    }
    
    // Then try with code identifiers
    for (const identifier of potentialIdentifiers) {
      if (identifier && identifier.length > 3) { // Avoid searching for really short identifiers
        const searchResults = await searchRepositoryCode(repository, identifier);
        searchResults.forEach(result => allFilePaths.add(result.filePath));
      }
    }
    
    // If we still don't have enough files, fetch top-level directories
    if (allFilePaths.size < 5) {
      // Get a sample of files from the repository
      const allFiles = await fetchRepositoryFiles(repository);
      
      // Filter for common source code directories
      const srcFiles = allFiles.filter(path => 
        path.startsWith('src/') || 
        path.startsWith('lib/') || 
        path.startsWith('app/') ||
        path.endsWith('.js') || 
        path.endsWith('.ts') || 
        path.endsWith('.jsx') || 
        path.endsWith('.tsx')
      );
      
      // Add some of these files to our analysis set
      srcFiles.slice(0, 10).forEach(path => allFilePaths.add(path));
    }
    
    // Convert to array
    const filePaths = Array.from(allFilePaths);
    
    // Fetch content for all identified files
    const fileContents: Record<string, string> = {};
    for (const path of filePaths) {
      try {
        fileContents[path] = await fetchFileContent(repository, path);
      } catch (error) {
        console.error(`Error fetching content for ${path}:`, error);
        fileContents[path] = `// Failed to fetch content: ${error}`;
      }
    }
    
    return { filePaths, fileContents };
  } catch (error) {
    console.error(`Error finding files for bug analysis:`, error);
    return { filePaths: [], fileContents: {} };
  }
}
