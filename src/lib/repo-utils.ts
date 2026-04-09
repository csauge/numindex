export interface RepoInfo {
  platform: 'github' | 'gitlab';
  owner: string;
  repo: string;
  full_name: string;
}

/**
 * Parses a repository URL to extract platform and repository identification.
 * Supports GitHub and GitLab.
 * @param url The repository URL (e.g., https://github.com/owner/repo)
 * @returns RepoInfo object or null if invalid or unsupported
 */
export function parseRepoUrl(url: string | null | undefined): RepoInfo | null {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url.trim());
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname.replace(/\/$/, ''); // Remove trailing slash
    
    // Path segments: ["", "owner", "repo", ...]
    const segments = pathname.split('/').filter(Boolean);
    
    if (segments.length < 2) return null;

    const owner = segments[0];
    let repo = segments[1];
    
    // Remove .git suffix if present
    if (repo.endsWith('.git')) {
      repo = repo.slice(0, -4);
    }

    if (hostname.includes('github.com')) {
      return {
        platform: 'github',
        owner,
        repo,
        full_name: `${owner}/${repo}`
      };
    }

    if (hostname.includes('gitlab.com')) {
      return {
        platform: 'gitlab',
        owner,
        repo,
        full_name: `${owner}/${repo}`
      };
    }
  } catch (e) {
    // Invalid URL
    return null;
  }

  return null;
}
