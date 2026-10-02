export interface DatingProfile {
  id: string;
  name: string;
  age: number;
  age_preference_min: number;
  age_preference_max: number;
  gender: string;
  interested_in: string;
  college: string | null;
  campus: string | null;
  department: string | null;
  course: string | null;
  year: string | null;
  bio: string | null;
  height: string | null;
  languages: string | null;
  relationship_goal: string | null;
  looking_for: string[];
  interests: string[];
  favorite_spot: string | null;
  instagram: string | null;
  spotify: string | null;
  photos: string[];
  primary_photo: string | null;
  hide_department: boolean;
  hide_course: boolean;
  hide_year: boolean;
  hide_online: boolean;
  hide_distance: boolean;
  hide_instagram: boolean;
  pause_discover: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatingSwipe {
  id: string;
  sender_id: string;
  receiver_id: string;
  action: 'like' | 'pass' | 'save';
  created_at: string;
}

export interface DatingMatch {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  unmatched_at: string | null;
}

export interface DatingMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface DatingReport {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
}
