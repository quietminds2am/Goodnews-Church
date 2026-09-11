// Hand-authored types mirroring the Supabase schema in /supabase/migrations.
// If you use the Supabase CLI, you can later replace this with generated
// types via `supabase gen types typescript`, keeping the same export names.

export type AdminRole = "super_admin" | "editor";

export interface Admin {
  id: string; // matches auth.users.id
  full_name: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

export type AnnouncementStatus = "draft" | "published";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  status: AnnouncementStatus;
  publish_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type EventStatus = "upcoming" | "past" | "cancelled";

export interface SocialLink {
  platform: "instagram" | "facebook" | "youtube" | "tiktok" | "x" | "whatsapp" | "other";
  url: string;
  label?: string;
}

export interface EventRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string | null;
  event_date: string; // ISO date
  start_time: string | null; // HH:MM
  end_time: string | null;
  location: string | null;
  flyer_url: string | null;
  flyer_alt: string | null;
  status: EventStatus;
  social_links: SocialLink[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  department: string | null;
  subscribed: boolean;
  source: string | null;
  unsubscribe_token: string;
  joined_at: string;
}

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";
export type CampaignType = "announcement" | "event_reminder" | "service_reminder" | "general";

export interface EmailCampaign {
  id: string;
  subject: string;
  body_html: string;
  campaign_type: CampaignType;
  status: CampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  related_event_id: string | null;
  created_by: string | null;
  /** Email address actually used to send (e.g. "Church Name <goodnewsyouthareahq@gmail.com>") —
   * set by api/send-campaign.ts from getFromAddress(), never from the sending admin's own account. */
  sender_email: string | null;
  recipient_count: number;
  created_at: string;
  updated_at: string;
}

export type BrandAssetType = "church_logo" | "member_logo" | "partner_logo";

export interface BrandAsset {
  id: string;
  name: string;
  type: BrandAssetType;
  image_url: string;
  active: boolean;
  uploaded_by: string | null;
  created_at: string;
}

export type AdvertPlacement = "home_top" | "home_middle" | "events_sidebar" | "footer";

export interface Advert {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  placement: AdvertPlacement;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  created_at: string;
  handled: boolean;
}

export interface SiteSettings {
  church_name: string;
  church_short_name: string;
  pastor_name: string;
  pastor_title: string;
  pastor_bio: string;
  pastor_photo_url: string | null;
  tagline: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  service_times: { label: string; time: string }[];
  socials: SocialLink[];
  seo_default_title: string;
  seo_default_description: string;
  og_image_url: string | null;
}

export interface Database {
  public: {
    Tables: {
      admins: { Row: Admin; Insert: Partial<Admin>; Update: Partial<Admin> };
      announcements: { Row: Announcement; Insert: Partial<Announcement>; Update: Partial<Announcement> };
      events: { Row: EventRow; Insert: Partial<EventRow>; Update: Partial<EventRow> };
      members: { Row: Member; Insert: Partial<Member>; Update: Partial<Member> };
      email_campaigns: { Row: EmailCampaign; Insert: Partial<EmailCampaign>; Update: Partial<EmailCampaign> };
      brand_assets: { Row: BrandAsset; Insert: Partial<BrandAsset>; Update: Partial<BrandAsset> };
      adverts: { Row: Advert; Insert: Partial<Advert>; Update: Partial<Advert> };
      contact_messages: { Row: ContactMessage; Insert: Partial<ContactMessage>; Update: Partial<ContactMessage> };
      site_settings: { Row: { key: string; value: unknown }; Insert: never; Update: { value: unknown } };
    };
  };
}
