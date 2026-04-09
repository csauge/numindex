import { describe, it, expect } from 'vitest';
import { parseRepoUrl } from '../repo-utils';

describe('parseRepoUrl', () => {
  it('should parse standard GitHub URLs', () => {
    const res = parseRepoUrl('https://github.com/facebook/react');
    expect(res).toEqual({
      platform: 'github',
      owner: 'facebook',
      repo: 'react',
      full_name: 'facebook/react'
    });
  });

  it('should handle trailing slashes', () => {
    const res = parseRepoUrl('https://github.com/facebook/react/');
    expect(res).toEqual({
      platform: 'github',
      owner: 'facebook',
      repo: 'react',
      full_name: 'facebook/react'
    });
  });

  it('should handle .git suffix', () => {
    const res = parseRepoUrl('https://github.com/facebook/react.git');
    expect(res).toEqual({
      platform: 'github',
      owner: 'facebook',
      repo: 'react',
      full_name: 'facebook/react'
    });
  });

  it('should parse GitLab URLs', () => {
    const res = parseRepoUrl('https://gitlab.com/gitlab-org/gitlab-runner');
    expect(res).toEqual({
      platform: 'gitlab',
      owner: 'gitlab-org',
      repo: 'gitlab-runner',
      full_name: 'gitlab-org/gitlab-runner'
    });
  });

  it('should return null for invalid URLs', () => {
    expect(parseRepoUrl('not-a-url')).toBeNull();
    expect(parseRepoUrl('https://example.com/owner/repo')).toBeNull();
    expect(parseRepoUrl('')).toBeNull();
    expect(parseRepoUrl(null)).toBeNull();
  });

  it('should return null for URLs with too few segments', () => {
    expect(parseRepoUrl('https://github.com/owner')).toBeNull();
  });
});
