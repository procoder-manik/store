-- One person may write to you more than once. Only newsletter sign ups must be unique per email.
drop index if exists public.leads_email_uidx;
create unique index if not exists leads_newsletter_email_uidx on public.leads (lower(email)) where email is not null and source = 'newsletter';
