import { z } from "zod";

// Every schema includes an optional honeypot field. Real users never see or
// fill it (it's visually hidden + tabindex -1); a filled honeypot means a
// bot submitted the form, so the caller silently drops the submission.
const honeypot = z.string().max(0, "Leave this field empty").optional().or(z.literal(""));

export const newsletterSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  hp_field: honeypot,
});
export type NewsletterInput = z.infer<typeof newsletterSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  subject: z.string().trim().min(3, "Please add a short subject").max(150),
  message: z.string().trim().min(10, "Message should be at least 10 characters").max(4000),
  hp_field: honeypot,
});
export type ContactInput = z.infer<typeof contactSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const announcementSchema = z.object({
  title: z.string().trim().min(3).max(180),
  body: z.string().trim().min(10).max(8000),
  status: z.enum(["draft", "published"]),
  publish_at: z.string().optional().nullable(),
});
export type AnnouncementInput = z.infer<typeof announcementSchema>;

export const eventSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(8000),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  event_date: z.string().min(1, "Event date is required"),
  start_time: z.string().optional().or(z.literal("")),
  end_time: z.string().optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  status: z.enum(["upcoming", "past", "cancelled"]),
  flyer_alt: z.string().trim().max(200).optional().or(z.literal("")),
});
export type EventInput = z.infer<typeof eventSchema>;

export const campaignSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  body_html: z.string().trim().min(10),
  campaign_type: z.enum(["announcement", "event_reminder", "service_reminder", "general"]),
  scheduled_at: z.string().optional().nullable(),
  related_event_id: z.string().optional().nullable(),
});
export type CampaignInput = z.infer<typeof campaignSchema>;

export const advertSchema = z.object({
  title: z.string().trim().min(2).max(150),
  link_url: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  placement: z.enum(["home_top", "home_middle", "events_sidebar", "footer"]),
  active: z.boolean(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
});
export type AdvertInput = z.infer<typeof advertSchema>;
