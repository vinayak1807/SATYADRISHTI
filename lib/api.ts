const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";


// =========================================================
// Generic API Fetch
// =========================================================

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    },
  );

  if (!response.ok) {
    let message = "API request failed.";

    try {
      const errorData = await response.json();

      if (errorData?.detail) {
        message = errorData.detail;
      }
    } catch {
      // Ignore JSON parsing errors
    }

    throw new Error(message);
  }

  return response.json();
}


// =========================================================
// Case Types
// =========================================================

export interface Case {
  id: string;
  caseNumber: string;
  status: string;
  documentId: string | null;
  riskScore: number | null;
  riskLevel: string | null;
  reviewStatus: string;
  officerDecision: string | null;
  officerRemarks: string | null;
  reportPath: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}


// =========================================================
// Cases API
// =========================================================

export interface CasesResponse {
  success: boolean;
  count: number;
  cases: Case[];
}


export interface CaseResponse {
  success: boolean;
  case: Case;
}


export async function getCases(): Promise<CasesResponse> {
  return apiFetch<CasesResponse>(
    "/api/cases",
  );
}


export async function getCase(
  caseId: string,
): Promise<CaseResponse> {
  return apiFetch<CaseResponse>(
    `/api/cases/${caseId}`,
  );
}


// =========================================================
// Verification Result
// =========================================================

export interface VerificationResult {
  id: string;
  caseId: string;
  status: string;

  ocrResult: Record<string, unknown> | null;

  documentValidation:
    | Record<string, unknown>
    | null;

  mrzResult:
    | Record<string, unknown>
    | null;

  faceVerification:
    | Record<string, unknown>
    | null;

  livenessAnalysis:
    | Record<string, unknown>
    | null;

  tamperingAnalysis:
    | Record<string, unknown>
    | null;

  crossDocumentAnalysis:
    | Record<string, unknown>
    | null;

  riskAssessment:
    | Record<string, unknown>
    | null;

  reportData:
    | Record<string, unknown>
    | null;

  errorMessage: string | null;

  createdAt: string | null;
  updatedAt: string | null;
}


export interface VerificationResultResponse {
  success: boolean;
  verificationResult: VerificationResult;
}


export async function getVerificationResult(
  caseId: string,
): Promise<VerificationResultResponse> {
  return apiFetch<VerificationResultResponse>(
    `/api/verification-results/${caseId}`,
  );
}


// =========================================================
// Audit Logs
// =========================================================

export interface AuditLog {
  id: string;
  caseId: string | null;
  action: string;
  actorType: string;
  actorId: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string | null;
}


export interface AuditLogsResponse {
  success: boolean;
  caseId: string;
  count: number;
  auditLogs: AuditLog[];
}


export async function getAuditLogs(
  caseId: string,
): Promise<AuditLogsResponse> {
  return apiFetch<AuditLogsResponse>(
    `/api/audit-logs/case/${caseId}`,
  );
}


// =========================================================
// PDF Investigation Report
// =========================================================

export function getReportPdfUrl(
  caseId: string,
): string {
  return (
    `${API_BASE_URL}/api/report/pdf/${caseId}`
  );
}
export interface UploadDocumentResponse {
  success: boolean
  documentId: string
  filename: string
  filePath: string
  message?: string
}

export async function uploadDocument(
  file: File,
): Promise<UploadDocumentResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(
    `${API_BASE_URL}/api/documents/upload`,
    {
      method: 'POST',
      body: formData,
    },
  )

  if (!response.ok) {
    let message = 'Document upload failed.'

    try {
      const errorData = await response.json()

      if (errorData?.detail) {
        message = errorData.detail
      }
    } catch {}

    throw new Error(message)
  }

  return response.json()
}
export interface CreateCaseResponse {
  success: boolean
  case: Case
}

export async function createCase(
  documentId: string,
): Promise<CreateCaseResponse> {
  return apiFetch<CreateCaseResponse>('/api/cases', {
    method: 'POST',
    body: JSON.stringify({
      documentId,
    }),
  })
}
export interface AddCaseDocumentResponse {
  success: boolean
  document: {
    id: string
    caseId: string
    documentId: string
    documentType: string
    originalFilename: string | null
    filePath: string | null
    createdAt: string | null
  }
}

export async function addDocumentToCase(
  caseId: string,
  documentId: string,
  documentType: string,
  originalFilename?: string,
  filePath?: string,
): Promise<AddCaseDocumentResponse> {
  return apiFetch<AddCaseDocumentResponse>(
    `/api/cases/${caseId}/documents`,
    {
      method: 'POST',
      body: JSON.stringify({
        documentId,
        documentType,
        originalFilename,
        filePath,
      }),
    },
  )
}
export async function analyzeCase(
  caseId: string,
): Promise<any> {
  return apiFetch<any>(
    `/api/cases/${caseId}/analyze`,
    {
      method: 'POST',
    },
  )
}
export async function updateCaseReview(
  caseId: string,
  data: {
    reviewStatus: string;
    officerDecision?: string | null;
    officerRemarks?: string | null;
  },
): Promise<CaseResponse> {
  return apiFetch<CaseResponse>(
    `/api/cases/${caseId}/review`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}