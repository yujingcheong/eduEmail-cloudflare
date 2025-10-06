-- Supabase Database Schema for eduEmail-cloudflare
-- This file contains the SQL schema migration from UniCloud to Supabase

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create temp_emails table (migrated from UniCloud collection)
CREATE TABLE IF NOT EXISTS temp_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at BIGINT NOT NULL,
    deleted BOOLEAN DEFAULT false,
    created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create cloudflare_edukg_email table (migrated from UniCloud collection)
CREATE TABLE IF NOT EXISTS cloudflare_edukg_email (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_from TEXT NOT NULL,
    email_to TEXT NOT NULL,
    subject TEXT DEFAULT '无主题',
    email_date TEXT,
    email_content_text TEXT DEFAULT '',
    email_content_html TEXT DEFAULT '',
    raw_content TEXT DEFAULT '',
    has_html BOOLEAN DEFAULT false,
    create_time BIGINT NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    worker_info JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_temp_emails_email ON temp_emails(email);
CREATE INDEX IF NOT EXISTS idx_temp_emails_created_at ON temp_emails(created_at);
CREATE INDEX IF NOT EXISTS idx_temp_emails_deleted ON temp_emails(deleted);

CREATE INDEX IF NOT EXISTS idx_cloudflare_email_to ON cloudflare_edukg_email(email_to);
CREATE INDEX IF NOT EXISTS idx_cloudflare_email_from ON cloudflare_edukg_email(email_from);
CREATE INDEX IF NOT EXISTS idx_cloudflare_create_time ON cloudflare_edukg_email(create_time);
CREATE INDEX IF NOT EXISTS idx_cloudflare_processed_at ON cloudflare_edukg_email(processed_at);

-- Row Level Security (RLS) policies
-- Enable RLS on both tables
ALTER TABLE temp_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloudflare_edukg_email ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for authenticated users
-- You can modify these policies based on your security requirements

-- Policy for temp_emails table
CREATE POLICY "Allow all operations on temp_emails" ON temp_emails
    FOR ALL USING (true) WITH CHECK (true);

-- Policy for cloudflare_edukg_email table  
CREATE POLICY "Allow all operations on cloudflare_edukg_email" ON cloudflare_edukg_email
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions to authenticated and anon roles
GRANT ALL ON temp_emails TO authenticated, anon;
GRANT ALL ON cloudflare_edukg_email TO authenticated, anon;

-- Grant usage on sequences if needed
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Comments for documentation
COMMENT ON TABLE temp_emails IS 'Stores temporary email addresses created by the system';
COMMENT ON TABLE cloudflare_edukg_email IS 'Stores emails received via Cloudflare Workers email routing';

COMMENT ON COLUMN temp_emails.email IS 'The temporary email address';
COMMENT ON COLUMN temp_emails.created_at IS 'Unix timestamp when email was created';
COMMENT ON COLUMN temp_emails.deleted IS 'Whether the email has been marked as deleted';

COMMENT ON COLUMN cloudflare_edukg_email.email_from IS 'Sender email address';
COMMENT ON COLUMN cloudflare_edukg_email.email_to IS 'Recipient email address';
COMMENT ON COLUMN cloudflare_edukg_email.subject IS 'Email subject line';
COMMENT ON COLUMN cloudflare_edukg_email.create_time IS 'Unix timestamp when email was processed';
COMMENT ON COLUMN cloudflare_edukg_email.worker_info IS 'Metadata about the Cloudflare Worker that processed the email';