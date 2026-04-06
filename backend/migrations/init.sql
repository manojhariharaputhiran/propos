-- RFP Automation DB Schema
-- Run once on initial setup

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand_voice TEXT DEFAULT 'professional',
    default_ppt_template_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    provider TEXT,
    provider_id TEXT,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'uploaded',
    title TEXT,
    raw_text TEXT,
    file_name TEXT,
    critic_report JSONB,
    export_format TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfp_id UUID REFERENCES rfps(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    draft_answer TEXT,
    confidence FLOAT,
    needs_sme BOOLEAN DEFAULT FALSE,
    sme_provided_answer TEXT,
    final_answer TEXT,
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS custom_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('skill', 'critic')),
    system_prompt TEXT,
    trigger_keywords TEXT[],
    tools TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rfps_org_id ON rfps(org_id);
CREATE INDEX IF NOT EXISTS idx_rfps_status ON rfps(status);
CREATE INDEX IF NOT EXISTS idx_questions_rfp_id ON questions(rfp_id);
CREATE INDEX IF NOT EXISTS idx_custom_agents_org_id ON custom_agents(org_id);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_rfps_updated_at ON rfps;
CREATE TRIGGER update_rfps_updated_at
    BEFORE UPDATE ON rfps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
