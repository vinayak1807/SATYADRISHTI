CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,

    action VARCHAR(100) NOT NULL,
    actor_type VARCHAR(50) NOT NULL DEFAULT 'system',
    actor_id VARCHAR(100),

    description TEXT,

    metadata JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
