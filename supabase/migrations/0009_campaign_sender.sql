-- ============================================================================
-- Record which email address a campaign actually sent from.
--
-- `created_by` already tracks which admin drafted/launched a campaign — that
-- was never the sending identity, but nothing recorded the actual sender
-- either, so there was no way to audit it after the fact. `sender_email` is
-- filled in by api/send-campaign.ts (from getFromAddress() in
-- api/_lib/mailer.ts, which is driven only by GMAIL_USER/RESEND_FROM_EMAIL
-- env vars — never by any admin's own account) at the moment a campaign is
-- sent, so what actually went out is always visible per campaign, not just
-- inferred from current env config.
-- ============================================================================

alter table public.email_campaigns
  add column if not exists sender_email text;
