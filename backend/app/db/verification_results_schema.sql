CREATE TABLE IF NOT EXISTS verification_results (
    id UUID PRIMARY KEY,

    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,

    status VARCHAR(30) NOT NULL DEFAULT 'pending',

    ocr_result JSONB,
    document_validation JSONB,
    mrz_result JSONB,

    face_verification JSONB,
    liveness_analysis JSONB,

    tampering_analysis JSONB,
    cross_document_analysis JSONB,

    risk_assessment JSONB,

    report_data JSONB,

    error_message TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(case_id)
);