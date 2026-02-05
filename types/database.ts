export interface SocialLink {
  platform: 'facebook' | 'instagram' | 'github' | 'linkedin' | 'portfolio';
  url: string;
}

export interface Profile {
  id: string;
  role: 'candidate' | 'recruiter';
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  resume_url: string | null;
  company_name: string | null;
  company_website?: string | null;
  bio: string | null;
  social_links?: SocialLink[];
  portfolio_images?: string[];
  onboarding_completed?: boolean;
  city?: string | null;
  city_lat?: number | null;
  city_lon?: number | null;
  search_radius?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Job {
  id: string;
  recruiter_id: string;
  title: string;
  company: string;
  description: string;
  location: string | null;
  city_lat?: number | null;
  city_lon?: number | null;
  salary_range: string | null;
  job_pdf_url?: string | null;
  job_image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Swipe {
  id: string;
  swiper_id: string;
  job_id: string | null;
  candidate_id: string | null;
  direction: 'right' | 'left';
  created_at?: string;
}

export interface Match {
  id: string;
  job_id: string;
  candidate_id: string;
  recruiter_id: string;
  created_at?: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface UserReport {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  description: string | null;
  created_at: string;
}

