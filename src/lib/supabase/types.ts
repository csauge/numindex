export interface Resource {
  id: string;
  title: string;
  description: string;
  link: string;
  category: string;
  language: 'fr' | 'en';
  image_url?: string;
  metadata: {
    tags: string[];
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface Suggestion extends Omit<Resource, 'updated_at'> {
  status: 'pending' | 'approved' | 'rejected';
  submitted_by?: string;
}
