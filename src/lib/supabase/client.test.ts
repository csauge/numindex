import { describe, it, expect, vi } from 'vitest';

// Hoist env stubbing so it runs before importing client
vi.hoisted(() => {
  vi.stubEnv('PUBLIC_SUPABASE_URL', 'https://mock.supabase.co');
  vi.stubEnv('PUBLIC_SUPABASE_ANON_KEY', 'mock-anon-key');
});

// Mock supabase-js so createClient returns a mocked storage client
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      storage: {
        from: () => ({
          getPublicUrl: (path: string) => ({
            data: { publicUrl: `https://supabase.com/storage/v1/render/image/public/suggestions/${path}` }
          })
        })
      }
    })
  };
});

import { getImageUrl } from './client';

describe('getImageUrl', () => {
  it('should return null if path is null or undefined', () => {
    expect(getImageUrl(null)).toBeNull();
    expect(getImageUrl(undefined)).toBeNull();
  });

  it('should return null if path is empty', () => {
    expect(getImageUrl('')).toBeNull();
  });

  it('should return the path as-is if it is a data URL (base64)', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    expect(getImageUrl(dataUrl)).toBe(dataUrl);
  });

  it('should return a public URL for standard paths', () => {
    const path = 'some-image.png';
    const result = getImageUrl(path);
    expect(result).not.toBeNull();
    expect(result).toContain(path);
    expect(result).toMatch(/^http/);
  });
});
