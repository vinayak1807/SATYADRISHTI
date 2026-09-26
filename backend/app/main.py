from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.documents import router as documents_router
from app.api.ocr import router as ocr_router
from app.api.face import router as face_router
from app.api.tampering import router as tampering_router
from app.api.cross_document import router as cross_document_router
from app.api.risk import router as risk_router
from app.api.report import router as report_router
from app.api.report_pdf import router as report_pdf_router
from app.api.cases import router as cases_router
from app.api.audit_logs import router as audit_logs_router
from app.api.verification_results import (
    router as verification_results_router
)
from app.api.case_analysis import router as case_analysis_router

app = FastAPI(
    title="Satyadristi API",
    description="Identity and Document Screening Backend",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(documents_router)
app.include_router(ocr_router)
app.include_router(face_router)
app.include_router(tampering_router)
app.include_router(cross_document_router)
app.include_router(risk_router)
app.include_router(report_router)
app.include_router(report_pdf_router)
app.include_router(cases_router)
app.include_router(audit_logs_router)
app.include_router(verification_results_router)
app.include_router(case_analysis_router)


@app.get("/")
async def root():
    return {
        "message": "Satyadristi API is running",
        "status": "success",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "satyadristi-backend",
    }