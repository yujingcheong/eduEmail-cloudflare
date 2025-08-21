-- Supabase Database Schema Migration
-- Run this script in your Supabase SQL editor

-- Create temp_emails table
CREATE TABLE temp_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at BIGINT NOT NULL,
    deleted BOOLEAN DEFAULT FALSE,
    created_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cloudflare_edukg_email table
CREATE TABLE cloudflare_edukg_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_from TEXT NOT NULL,
    email_to TEXT NOT NULL,
    subject TEXT,
    email_content_text TEXT,
    email_content_html TEXT,
    raw_content TEXT,
    email_type TEXT DEFAULT 'text',
    has_html BOOLEAN DEFAULT FALSE,
    has_text BOOLEAN DEFAULT TRUE,
    text_length INTEGER DEFAULT 0,
    html_length INTEGER DEFAULT 0,
    create_time BIGINT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    worker_info JSONB,
    created_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_temp_emails_email ON temp_emails(email);
CREATE INDEX idx_temp_emails_created_at ON temp_emails(created_at);
CREATE INDEX idx_cloudflare_email_to ON cloudflare_edukg_email(email_to);
CREATE INDEX idx_cloudflare_email_processed_at ON cloudflare_edukg_email(processed_at DESC);
CREATE INDEX idx_cloudflare_email_create_time ON cloudflare_edukg_email(create_time DESC);

-- Enable Row Level Security (optional)
ALTER TABLE temp_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloudflare_edukg_email ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Public read access" ON temp_emails FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON temp_emails FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON temp_emails FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON temp_emails FOR DELETE USING (true);

CREATE POLICY "Public read access" ON cloudflare_edukg_email FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON cloudflare_edukg_email FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON cloudflare_edukg_email FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON cloudflare_edukg_email FOR DELETE USING (true);