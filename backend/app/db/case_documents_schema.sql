CREATE TABLE IF NOT EXISTS case_documents (
    id UUID PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,

    document_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL,

    original_filename TEXT,
    file_path TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(case_id, document_id)
);