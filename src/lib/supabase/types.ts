export interface Resource {
  id: string;
  title: string;
  description: string;
  link: string;
  category: string;
  language: 'fr' | 'en';
  image_url?: string | null;
  tags: string[];
  related_ids: string[]; // UUIDs of related entities (co-authors, partners, etc.)
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
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
