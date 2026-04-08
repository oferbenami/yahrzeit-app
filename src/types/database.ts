export type UserRole = "admin" | "member";
export type RelationshipDegree = "first" | "second" | "extended";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  notification_prefs: NotificationPrefs | null;
  created_at: string;
}

export interface NotificationPrefs {
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp: boolean;
  days_before: number[];
}

export interface FamilyGroup {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
  user?: UserProfile;
}

export interface Deceased {
  id: string;
  group_id: string;
  created_by: string;
  full_name: string;
  photo_url: string | null;
  birth_date_gregorian: string | null;
  birth_date_hebrew: string | null;
  death_date_gregorian: string;
  death_date_hebrew: string;
  death_date_hebrew_day: number;
  death_date_hebrew_month: number;
  cemetery_name: string | null;
  cemetery_block: string | null;
  cemetery_plot: string | null;
  cemetery_notes: string | null;
  gravestone_photo_url: string | null;
  relationship_label: string | null;
  relationship_degree: RelationshipDegree | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface YahrzeitEvent {
  id: string;
  deceased_id: string;
  hebrew_year: number;
  yahrzeit_date_gregorian: string;
  yahrzeit_date_hebrew: string;
  shabbat_eve_before: string | null;
  notifications_sent: Record<string, boolean>;
  created_at: string;
  deceased?: Deceased;
}

export interface ReminderSchedule {
  id: string;
  deceased_id: string;
  user_id: string;
  days_before: number[];
  channels: string[];
  custom_message: string | null;
  active: boolean;
}

export interface GatheringEvent {
  id: string;
  deceased_id: string;
  yahrzeit_date: string;
  location_name: string | null;
  location_address: string | null;
  meeting_time: string | null;
  notes: string | null;
  created_by: string;
  ical_uid: string | null;
}
