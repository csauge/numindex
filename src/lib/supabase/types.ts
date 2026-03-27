export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  link: string;
  category: string;
  image_url?: string;
  tags: string[];
  related_ids: string[]; // UUIDs of related entities (co-authors, partners, etc.)
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export type SuggestionStatus = 'pending' | 'approved' | 'rejected';
export type SuggestionAction = 'create' | 'update' | 'delete';

export interface Suggestion extends Omit<Resource, 'updated_at'> {
  status: SuggestionStatus;
  action: SuggestionAction;
  resource_id?: string | null;
  reason?: string | null;
  submitted_by?: string | null;
}

export interface Favorite {
  id: string;
  user_id: string;
  resource_id: string;
  created_at: string;
}
