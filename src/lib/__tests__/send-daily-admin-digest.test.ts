import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendDailyAdminDigest } from '../../../scripts/send-daily-admin-digest.mjs';

// Mock fetch
global.fetch = vi.fn();

describe('sendDailyAdminDigest script', () => {
  const mockBrevoKey = 'test-brevo-key';
  const mockEmail = 'admin@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true and do nothing if no pending suggestions', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      })
    };

    const result = await sendDailyAdminDigest(mockSupabase, mockBrevoKey, mockEmail);
    expect(result).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should send an email if pending suggestions and admins exist', async () => {
    const mockSupabase = {
      from: vi.fn().mockImplementation((table) => {
        if (table === 'suggestions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [{ id: '1', title: 'Test', category: 'outil', action: 'create', created_at: new Date().toISOString() }],
                  error: null
                })
              })
            })
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'admin-1' }],
                error: null
              })
            })
          };
        }
      }),
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({
            data: { users: [{ id: 'admin-1', email: 'real-admin@example.com' }] },
            error: null
          })
        }
      }
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messageId: '123' })
    });

    const result = await sendDailyAdminDigest(mockSupabase, mockBrevoKey, mockEmail);
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
    
    const fetchArgs = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchArgs[1].body);
    expect(body.bcc[0].email).toBe('real-admin@example.com');
    expect(body.subject).toContain('1 suggestion(s)');
  });
});
