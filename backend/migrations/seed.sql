-- Seed data for RFP Automation
-- Idempotent: uses ON CONFLICT DO NOTHING

-- Organisation
INSERT INTO organisations (id, name, brand_voice)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Demo Organisation', 'professional')
ON CONFLICT DO NOTHING;

-- Demo user (for dev-login)
INSERT INTO users (id, org_id, email, name, provider, provider_id, role)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'demo@example.com',
    'Demo User',
    'dev',
    'demo',
    'admin'
)
ON CONFLICT (email) DO NOTHING;
