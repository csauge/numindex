import { describe, it, expect, vi } from 'vitest';
import { getImageUrl } from './client';

// Mock supabase client
vi.mock('./client', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    // We only mock the supabase object used inside getImageUrl
    supabase: {
      storage: {
        from: () => ({
          getPublicUrl: (path: string) => ({
            data: { publicUrl: `https://supabase.com/storage/v1/render/image/public/suggestions/${path}` }
          })
        })
      }
    }
  };
});

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
    expect(result).toContain(path);
    expect(result).toMatch(/^http/);
  });
});
