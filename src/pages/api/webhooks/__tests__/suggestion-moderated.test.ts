import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../suggestion-moderated';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        getUserById: vi.fn()
      }
    }
  }))
}));

// Mock fetch for Brevo
global.fetch = vi.fn();

describe('suggestion-moderated webhook', () => {
  const mockEnv = {
    PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    BREVO_API_KEY: 'test-brevo-key',
    WEBHOOK_SECRET: 'test-secret'
  };

  const mockLocals = {
    runtime: { env: mockEnv }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if secret is missing or invalid', async () => {
    const request = new Request('http://localhost/api/webhooks/suggestion-moderated', {
      method: 'POST',
      headers: { 'X-Webhook-Secret': 'wrong-secret' },
      body: JSON.stringify({})
    });

    const response = await POST({ request, locals: mockLocals } as any);
    expect(response.status).toBe(401);
  });

  it('should return 200 and do nothing if status did not change to approved/rejected', async () => {
    const request = new Request('http://localhost/api/webhooks/suggestion-moderated', {
      method: 'POST',
      headers: { 'X-Webhook-Secret': 'test-secret' },
      body: JSON.stringify({
        record: { status: 'pending' },
        old_record: { status: 'pending' }
      })
    });

    const response = await POST({ request, locals: mockLocals } as any);
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.message).toContain('No notification needed');
  });

  it('should send an email when status changes from pending to approved', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { email: 'submitter@example.com' } },
      error: null
    });
    
    (createClient as any).mockReturnValue({
      auth: { admin: { getUserById: mockGetUser } }
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messageId: '123' })
    });

    const request = new Request('http://localhost/api/webhooks/suggestion-moderated', {
      method: 'POST',
      headers: { 'X-Webhook-Secret': 'test-secret' },
      body: JSON.stringify({
        record: { status: 'approved', action: 'create', title: 'New Resource', submitted_by: 'user-123' },
        old_record: { status: 'pending' }
      })
    });

    const response = await POST({ request, locals: mockLocals } as any);
    expect(response.status).toBe(200);
    expect(mockGetUser).toHaveBeenCalledWith('user-123');
    expect(global.fetch).toHaveBeenCalledWith('https://api.brevo.com/v3/smtp/email', expect.any(Object));
    
    const fetchArgs = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchArgs[1].body);
    expect(body.to[0].email).toBe('submitter@example.com');
    expect(body.subject).toContain('de création');
    expect(body.subject).toContain('approuvée');
    expect(body.htmlContent).toContain('Elle est désormais visible sur le site');
  });

  it('should send a specific email for an approved deletion', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { email: 'submitter@example.com' } },
      error: null
    });
    
    (createClient as any).mockReturnValue({
      auth: { admin: { getUserById: mockGetUser } }
    });

    (global.fetch as any).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    const request = new Request('http://localhost/api/webhooks/suggestion-moderated', {
      method: 'POST',
      headers: { 'X-Webhook-Secret': 'test-secret' },
      body: JSON.stringify({
        record: { status: 'approved', action: 'delete', title: 'Old Resource', submitted_by: 'user-123' },
        old_record: { status: 'pending' }
      })
    });

    const response = await POST({ request, locals: mockLocals } as any);
    expect(response.status).toBe(200);
    
    const fetchArgs = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchArgs[1].body);
    expect(body.subject).toContain('de suppression');
    expect(body.htmlContent).toContain('retirée du site');
    expect(body.htmlContent).not.toContain('Voir la ressource');
  });

  it('should send a specific email for an approved modification', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { email: 'submitter@example.com' } },
      error: null
    });
    
    (createClient as any).mockReturnValue({
      auth: { admin: { getUserById: mockGetUser } }
    });

    (global.fetch as any).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    const request = new Request('http://localhost/api/webhooks/suggestion-moderated', {
      method: 'POST',
      headers: { 'X-Webhook-Secret': 'test-secret' },
      body: JSON.stringify({
        record: { status: 'approved', action: 'update', title: 'Updated Resource', submitted_by: 'user-123', resource_id: 'rid-456' },
        old_record: { status: 'pending' }
      })
    });

    const response = await POST({ request, locals: mockLocals } as any);
    expect(response.status).toBe(200);
    
    const fetchArgs = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchArgs[1].body);
    expect(body.subject).toContain('de modification');
    expect(body.htmlContent).toContain('modifications sont désormais visibles');
    expect(body.htmlContent).toContain('Voir la ressource');
    expect(body.htmlContent).toContain('resource/rid-456');
  });

  it('should handle user not found', async () => {
    (createClient as any).mockReturnValue({
      auth: { admin: { getUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) } }
    });

    const request = new Request('http://localhost/api/webhooks/suggestion-moderated', {
      method: 'POST',
      headers: { 'X-Webhook-Secret': 'test-secret' },
      body: JSON.stringify({
        record: { status: 'rejected', title: 'Bad Resource', submitted_by: 'user-999' },
        old_record: { status: 'pending' }
      })
    });

    const response = await POST({ request, locals: mockLocals } as any);
    expect(response.status).toBe(404);
  });
});
