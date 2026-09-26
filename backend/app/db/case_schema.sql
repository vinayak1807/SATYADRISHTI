CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY,

    case_number VARCHAR(50) UNIQUE NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'pending',

    document_id UUID,

    risk_score INTEGER,

    risk_level VARCHAR(20),

    review_status VARCHAR(30) NOT NULL DEFAULT 'pending',

    officer_decision VARCHAR(50),

    officer_remarks TEXT,

    report_path TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);