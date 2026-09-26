'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  getCases,
  getCase,
  getVerificationResult,
  getAuditLogs,
  getReportPdfUrl,
  updateCaseReview,
  uploadDocument,
  createCase,
  addDocumentToCase,
  analyzeCase,
} from '@/lib/api'
import { Bell, BookOpen, ChevronDown, ClipboardCheck, FileCheck2, FileText, Filter, Flag, FolderOpen, Gauge, LayoutDashboard, LogOut, Menu, Search, Settings, ShieldCheck, SlidersHorizontal, UserRound, Upload, Users, X, CheckCircle2, AlertTriangle, Clock3, ArrowUpRight, ChevronLeft, ChevronRight, Download, Printer, Eye, Activity, ScrollText, Camera, CameraOff, RefreshCw } from 'lucide-react'

const logo = 'PHOTO-2026-09-23-21-32-45.jpg'

type Status = 'Approved' | 'Pending' | 'Manual Review' | 'High Risk' | 'Escalated'
type Case = {
  id: string
  backendId?: string
  applicant: string
  nationality: string
  document: string
  risk: number | null
  status: Status
  officer: string
  created: string
  updated: string
}
const cases: Case[] = [
  {
    id: 'CASE-2026-1048',
    applicant: 'Rahul Sharma',
    nationality: 'India',
    document: 'Passport',
    risk: 18,
    status: 'Approved',
    officer: 'IMM-2026-001',
    created: '22 Sep 2026',
    updated: '22 Sep 2026',
  },
  {
    id: 'CASE-2026-1047',
    applicant: 'Daniel Smith',
    nationality: 'USA',
    document: 'Passport + Visa',
    risk: 62,
    status: 'Manual Review',
    officer: 'IMM-2026-001',
    created: '22 Sep 2026',
    updated: '22 Sep 2026',
  },
  {
    id: 'CASE-2026-1046',
    applicant: 'Ahmed Khan',
    nationality: 'UAE',
    document: 'Passport',
    risk: 91,
    status: 'Escalated',
    officer: 'IMM-2026-004',
    created: '21 Sep 2026',
    updated: '22 Sep 2026',
  },
]



const navGroups = [
  { label: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
  { label: 'Case Management', items: [{ label: 'All Cases', href: '/cases', icon: FolderOpen }, { label: 'New Screening', href: '/upload', icon: Upload }, { label: 'Pending Review', href: '/cases?status=Pending', icon: Clock3 }, { label: 'High Risk Cases', href: '/cases?risk=High', icon: AlertTriangle }] },
  { label: 'Document Screening', items: [{ label: 'Verification', href: '/verification', icon: ShieldCheck }, { label: 'OCR Results', href: '/verification?stage=ocr', icon: FileText }, { label: 'Tampering Analysis', href: '/verification?stage=tampering', icon: FileCheck2 }] },
  { label: 'Reports & Oversight', items: [{ label: 'Investigation Reports', href: '/reports', icon: BookOpen }, { label: 'Analytics', href: '/analytics', icon: Activity }, { label: 'Alerts', href: '/alerts', icon: Bell }, { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText }] },
]

function statusClass(status: Status) { return status === 'Approved' ? 'approved' : status === 'Pending' ? 'pending' : status === 'Manual Review' ? 'review' : 'danger' }
function riskLabel(risk: number) { return risk >= 75 ? 'High' : risk >= 45 ? 'Medium' : 'Low' }
function riskClass(risk: number) { return risk >= 75 ? 'risk-high' : risk >= 45 ? 'risk-medium' : 'risk-low' }

function Header({ onMenu }: { onMenu: () => void }) {
  return <header className="topbar"><button className="mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu /></button><div className="brand"><img src={logo} alt="Satyadristi portal logo" /><div><strong>SATYADRISHTI</strong><span>Document Screening & Verification System</span></div></div><div className="top-actions"><button className="icon-button" aria-label="Notifications"><Bell /></button><div className="officer"><div className="avatar">DO</div><div><strong>Officer</strong><span>IMM-2026-001</span></div><ChevronDown /></div></div></header>
}
function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname()
  const searchParams = useSearchParams()

  function isActive(href: string) {
    const [hrefPath, queryString] = href.split('?')

    if (hrefPath === '/dashboard') {
      return path === '/dashboard' || path === '/'
    }

    if (hrefPath === '/cases') {
      const status = searchParams.get('status')
      const risk = searchParams.get('risk')

      if (queryString === 'status=Pending') {
        return path === '/cases' && status === 'Pending'
      }

      if (queryString === 'risk=High') {
        return path === '/cases' && risk === 'High'
      }

      return path === '/cases' && !status && !risk
    }

    if (hrefPath === '/verification') {
      const stage = searchParams.get('stage')

      if (queryString === 'stage=ocr') {
        return path === '/verification' && stage === 'ocr'
      }

      if (queryString === 'stage=tampering') {
        return path === '/verification' && stage === 'tampering'
      }

      return path === '/verification' && !stage
    }

    return path === hrefPath
  }

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-title">Portal navigation</div>

        {navGroups.map((group) => (
          <div className="nav-group" key={group.label}>
            <div className="nav-label">{group.label}</div>

            {group.items.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon

              return (
                <Link
                  onClick={onClose}
                  className={`nav-item ${active ? 'active' : ''}`}
                  href={item.href}
                  key={item.label}
                >
                  <Icon />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}

        <div className="sidebar-footer">
          <Link className="nav-item" href="/profile">
            <UserRound />
            Officer Profile
          </Link>

          <Link className="nav-item" href="/settings">
            <Settings />
            System Settings
          </Link>

          <div className="secure">
            <ShieldCheck />
            Secure officer session
            <br />
            <span>Session-8831 · Active</span>
          </div>
        </div>
      </aside>

      {open && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}
    </>
  )
}
function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) { return <div className="page-header"><div><div className="breadcrumbs"><Link href="/dashboard">Portal</Link><span>/</span><span>{eyebrow || title}</span></div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div> }
function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <span className={`badge ${className}`}>{children}</span> }
function Kpi({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: any; tone: string }) { return <div className="kpi"><div className={`kpi-icon ${tone}`}><Icon /></div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div> }
function CasesTable({
  limit,
  compact = false,
}: {
  limit?: number
  compact?: boolean
}) {
  const searchParams = useSearchParams()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)

  const routeStatus = searchParams.get('status')
  const routeRisk = searchParams.get('risk')

  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // -------------------------------------------------------
  // Load cases from FastAPI
  // -------------------------------------------------------

  useEffect(() => {
    async function loadCases() {
      try {
        setLoading(true)
        setError('')

        const response = await getCases()

        const mappedCases: Case[] = response.cases.map((item) => {
          let displayStatus: Status = 'Pending'

          if (item.officerDecision) {
            const decision =
              item.officerDecision.toLowerCase()

            if (
              decision.includes('approve') ||
              decision === 'approved'
            ) {
              displayStatus = 'Approved'
            } else if (
              decision.includes('escalat') ||
              decision.includes('reject')
            ) {
              displayStatus = 'Escalated'
            } else {
              displayStatus = 'Manual Review'
            }
          } else if (
            item.riskLevel?.toLowerCase() === 'high'
          ) {
            displayStatus = 'High Risk'
          } else if (
            item.reviewStatus?.toLowerCase() === 'pending'
          ) {
            displayStatus = 'Pending'
          }

          return {
            id: item.caseNumber,
            backendId: item.id,

            // These fields are not currently stored
            // directly in the cases table.
            applicant: 'Not available',
            nationality: 'Not available',

            document: item.documentId
              ? 'Identity document'
              : 'No document',

            risk: item.riskScore,

            status: displayStatus,

            // Officer information is not yet stored
            // in the cases table.
            officer: 'Not assigned',

            created: item.createdAt
              ? new Date(
                  item.createdAt,
                ).toLocaleDateString(
                  'en-IN',
                  {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  },
                )
              : '—',

            updated: item.updatedAt
              ? new Date(
                  item.updatedAt,
                ).toLocaleDateString(
                  'en-IN',
                  {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  },
                )
              : '—',
          }
        })

        setCases(mappedCases)
      } catch (err) {
        console.error(
          'Failed to load cases:',
          err,
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load cases.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadCases()
  }, [])

  // Keep sidebar filters synchronized with the current URL.
  useEffect(() => {
    if (routeStatus === 'Pending') {
      setStatus('Pending')
      setPage(1)
      return
    }

    if (routeRisk === 'High') {
      setStatus('All')
      setPage(1)
      return
    }

    setStatus('All')
    setPage(1)
  }, [routeStatus, routeRisk])

  // -------------------------------------------------------
  // Filter cases
  // -------------------------------------------------------

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const matchesQuery =
        !query ||
        `${c.id} ${c.applicant} ${c.nationality}`
          .toLowerCase()
          .includes(query.toLowerCase())

      const matchesStatus =
        status === 'All' ||
        c.status === status

      const matchesRisk =
        routeRisk !== 'High' ||
        (typeof c.risk === 'number' && c.risk >= 75)

      return (
        matchesQuery &&
        matchesStatus &&
        matchesRisk
      )
    })
  }, [cases, query, status, routeRisk])

  // -------------------------------------------------------
  // Pagination
  // -------------------------------------------------------

  const rows = limit
    ? filtered.slice(0, limit)
    : filtered.slice(
        (page - 1) * 5,
        page * 5,
      )

  // -------------------------------------------------------
  // Loading state
  // -------------------------------------------------------

  if (loading) {
    return (
      <div className="table-panel">
        <div className="empty-panel">
          <Activity />
          <h2>Loading cases...</h2>
          <p>
            Retrieving case records from the
            Satyadristi backend.
          </p>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------
  // Error state
  // -------------------------------------------------------

  if (error) {
    return (
      <div className="table-panel">
        <div className="empty-panel">
          <AlertTriangle />
          <h2>Unable to load cases</h2>
          <p>{error}</p>

          <button
            className="button primary"
            onClick={() =>
              window.location.reload()
            }
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="table-panel">

      {!compact && (
        <div className="table-tools">

          <div className="search">
            <Search />

            <input
              aria-label="Search cases"
              placeholder="Search case ID, applicant or country"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option>All</option>
            <option>Approved</option>
            <option>Pending</option>
            <option>Manual Review</option>
            <option>High Risk</option>
            <option>Escalated</option>
          </select>

          <button className="button secondary">
            <Filter />
            More filters
          </button>

        </div>
      )}

      <div className="table-wrap">

        <table>

          <thead>
            <tr>
              <th>Case ID</th>
              <th>Applicant</th>
              <th>Nationality</th>
              <th>Document</th>
              <th>Risk</th>
              <th>Status</th>
              <th>Assigned Officer</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>

          <tbody>

            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                  }}
                >
                  No cases found.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id}>

                  <td>
                    <Link
                      className="case-link"
                      href={`/cases/${c.backendId || c.id}`}
                    >
                      {c.id}
                    </Link>
                  </td>

                  <td>
                    <strong>
                      {c.applicant}
                    </strong>
                  </td>

                  <td>
                    {c.nationality}
                  </td>

                  <td>
                    {c.document}
                  </td>

                  <td>
                    {c.risk === null ? (
                      <span className="risk">
                        —
                      </span>
                    ) : (
                      <span
                        className={`risk ${riskClass(
                          c.risk,
                        )}`}
                      >
                        {c.risk}

                        <small>
                          {riskLabel(
                            c.risk,
                          )}
                        </small>
                      </span>
                    )}
                  </td>

                  <td>
                    <Badge
                      className={statusClass(
                        c.status,
                      )}
                    >
                      {c.status}
                    </Badge>
                  </td>

                  <td>
                    {c.officer}
                  </td>

                  <td>
                    {c.updated}
                  </td>

                  <td>
                    <Link
                      className="view-link"
                      href={`/cases/${c.backendId || c.id}`}
                    >
                      View
                      <ArrowUpRight />
                    </Link>
                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

      {!compact && (
        <div className="pagination">

          <span>
            Showing {rows.length} of{' '}
            {filtered.length} cases
          </span>

          <div>

            <button
              aria-label="Previous page"
              onClick={() =>
                setPage(
                  Math.max(
                    1,
                    page - 1,
                  ),
                )
              }
              disabled={page === 1}
            >
              <ChevronLeft />
            </button>

            <b>{page}</b>

            <button
              aria-label="Next page"
              onClick={() =>
                setPage(page + 1)
              }
              disabled={
                page * 5 >=
                filtered.length
              }
            >
              <ChevronRight />
            </button>

          </div>

        </div>
      )}

    </div>
  )
}
function Dashboard() {
  const [dashboardCases, setDashboardCases] = useState<any[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await getCases()

        if (response?.cases) {
          setDashboardCases(response.cases)
        }
      } catch (error) {
        console.error(
          "Failed to load dashboard cases:",
          error,
        )
      } finally {
        setDashboardLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const totalCases = dashboardCases.length

  const pendingReview = dashboardCases.filter(
    (item) =>
      item.reviewStatus === "pending" ||
      item.reviewStatus === "in_review",
  ).length

  const highRisk = dashboardCases.filter(
    (item) =>
      item.riskLevel?.toLowerCase() === "high" ||
      (typeof item.riskScore === "number" &&
        item.riskScore >= 70),
  ).length

  const today = new Date().toDateString()

  const approvedToday = dashboardCases.filter(
    (item) =>
      item.reviewStatus?.toLowerCase() === "approved" &&
      item.updatedAt &&
      new Date(item.updatedAt).toDateString() === today,
  ).length

  return (
    <>
      <PageHeader
        title="Officer Dashboard"
        description="Document screening and verification overview for the current officer session."
        action={
          <Link
            href="/upload"
            className="button primary"
          >
            <Upload />
            New screening case
          </Link>
        }
      />

      <div className="kpi-grid">

        <Kpi
          label="Total cases"
          value={
            dashboardLoading
              ? "—"
              : totalCases.toString()
          }
          detail="Cases currently stored in the screening system"
          icon={FolderOpen}
          tone="blue"
        />

        <Kpi
          label="Pending review"
          value={
            dashboardLoading
              ? "—"
              : pendingReview.toString()
          }
          detail="Cases awaiting officer review"
          icon={Clock3}
          tone="amber"
        />

        <Kpi
          label="High risk"
          value={
            dashboardLoading
              ? "—"
              : highRisk.toString()
          }
          detail="Cases requiring additional attention"
          icon={AlertTriangle}
          tone="red"
        />

        <Kpi
          label="Approved today"
          value={
            dashboardLoading
              ? "—"
              : approvedToday.toString()
          }
          detail="Cases marked approved today"
          icon={CheckCircle2}
          tone="green"
        />

      </div>

      <div className="dashboard-grid">

        <section className="panel span-two">

          <div className="panel-heading">

            <div>
              <h2>
                Recent cases
              </h2>

              <p>
                Latest case activity across the screening unit.
              </p>
            </div>

            <Link
              href="/cases"
              className="text-link"
            >
              View all cases
              <ArrowUpRight />
            </Link>

          </div>

          <CasesTable
            compact
            limit={5}
          />

        </section>

        <section className="panel">

          <div className="panel-heading">

            <div>
              <h2>
                Priority alerts
              </h2>

              <p>
                Items requiring officer attention.
              </p>
            </div>

            <Bell />

          </div>

          <div className="alert-list">

            <div className="alert-item">

              <span className="alert-mark red">
                <AlertTriangle />
              </span>

              <div>
                <strong>
                  High risk cases
                </strong>

                <p>
                  {highRisk} case
                  {highRisk === 1 ? "" : "s"} currently
                  require additional attention.
                </p>

                <small>
                  Current system data
                </small>
              </div>

            </div>

            <div className="alert-item">

              <span className="alert-mark amber">
                <Clock3 />
              </span>

              <div>
                <strong>
                  Pending officer review
                </strong>

                <p>
                  {pendingReview} case
                  {pendingReview === 1 ? "" : "s"} awaiting
                  review.
                </p>

                <small>
                  Current system data
                </small>
              </div>

            </div>

            <div className="alert-item">

              <span className="alert-mark blue">
                <FileText />
              </span>

              <div>
                <strong>
                  Screening reports
                </strong>

                <p>
                  Generated reports are available from
                  individual case records.
                </p>

                <small>
                  Current system data
                </small>
              </div>

            </div>

          </div>

        </section>

        <section className="panel">

          <div className="panel-heading">

            <div>
              <h2>
                Screening activity
              </h2>

              <p>
                Current case processing overview
              </p>
            </div>

            <Activity />

          </div>

          <div className="empty-panel">

            <Activity />

            <h2>
              Live case data connected
            </h2>

            <p>
              Dashboard statistics are calculated from
              the cases stored in the backend.
            </p>

          </div>

        </section>

      </div>
    </>
  )
}

function LiveFaceVerificationPanel({
  caseId,
  onCompleted,
}: {
  caseId: string
  onCompleted: () => Promise<void> | void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [cameraActive, setCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraActive(false)
  }

  async function startCamera() {
    setError('')
    setMessage('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not available in this browser.')
      return
    }

    try {
      stopCamera()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setCameraActive(true)
      setMessage(
        'Camera connected. Ask the person to look naturally at the camera before capture.',
      )
    } catch (err) {
      console.error('Camera access failed:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to access the camera. Please allow camera permission and try again.',
      )
    }
  }

  function captureFrame() {
    setError('')
    setMessage('')

    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || video.readyState < 2) {
      setError('Camera is not ready yet. Start the camera and try again.')
      return
    }

    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720

    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')

    if (!context) {
      setError('Unable to capture the camera frame.')
      return
    }

    context.drawImage(video, 0, 0, width, height)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Unable to create the captured image.')
          return
        }

        const file = new File(
          [blob],
          `live-face-${Date.now()}.jpg`,
          { type: 'image/jpeg' },
        )

        setCapturedFile(file)
        setCapturedImage(URL.createObjectURL(blob))
        setMessage(
          'Live face captured. Review the image, then start verification.',
        )
      },
      'image/jpeg',
      0.92,
    )
  }

  async function handleVerify() {
    if (!caseId) {
      setError('Select a screening case before starting verification.')
      return
    }

    if (!capturedFile) {
      setError('Capture a live face image first.')
      return
    }

    try {
      setProcessing(true)
      setError('')
      setMessage(
        'Uploading the live capture and running liveness + face comparison...',
      )

      // The existing backend case-analysis pipeline already:
      // 1. Finds the primary identity document.
      // 2. Finds a document attached as "live_photo".
      // 3. Runs face comparison.
      // 4. Runs liveness analysis.
      //
      // We therefore reuse the established pipeline rather than
      // creating a second, duplicate face-verification implementation.
      const uploadResult = await uploadDocument(capturedFile)

      await addDocumentToCase(
        caseId,
        uploadResult.documentId,
        'live_photo',
        uploadResult.filename,
        uploadResult.filePath,
      )

      await analyzeCase(caseId)
      await onCompleted()

      setMessage(
        'Live verification completed. Review the liveness and face-comparison results below.',
      )
    } catch (err) {
      console.error('Live face verification failed:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Live face verification could not be completed.',
      )
    } finally {
      setProcessing(false)
    }
  }

  function retake() {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
    }

    setCapturedImage(null)
    setCapturedFile(null)
    setMessage('Ready for a new live capture.')
    setError('')
  }

  useEffect(() => {
    return () => {
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage)
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [capturedImage])

  return (
    <section
      className="panel"
      style={{
        marginTop: '20px',
        border: '1px solid #d8e2ec',
      }}
    >
      <div className="panel-heading">
        <div>
          <h2>Live Face Verification</h2>
          <p>
            Capture a consenting participant&apos;s live face using the
            workstation camera, then run the existing liveness and face
            comparison pipeline for this case.
          </p>
        </div>
        <Camera />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.45fr) minmax(280px, 0.75fr)',
          gap: '18px',
          alignItems: 'start',
        }}
      >
        <div>
          <div
            style={{
              position: 'relative',
              width: '100%',
              minHeight: '360px',
              background: '#0f1f2e',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
            }}
          >
            {!capturedImage ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                aria-label="Live face camera preview"
                style={{
                  display: 'block',
                  width: '100%',
                  height: '360px',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                  background: '#0f1f2e',
                }}
              />
            ) : (
              <img
                src={capturedImage}
                alt="Captured live face preview"
                style={{
                  display: 'block',
                  width: '100%',
                  height: '360px',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                  background: '#0f1f2e',
                }}
              />
            )}

            {!cameraActive && !capturedImage && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '10px',
                  color: '#dbeafe',
                  textAlign: 'center',
                  padding: '24px',
                }}
              >
                <Camera size={34} />
                <strong>Camera is off</strong>
                <span style={{ fontSize: '13px', opacity: 0.8 }}>
                  Start the workstation camera to begin live verification.
                </span>
              </div>
            )}

            {cameraActive && !capturedImage && (
              <div
                style={{
                  position: 'absolute',
                  left: '18px',
                  right: '18px',
                  bottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(15, 31, 46, 0.78)',
                  color: '#fff',
                  fontSize: '13px',
                }}
              >
                <span>Camera connected</span>
                <span>Position face inside the frame</span>
              </div>
            )}
          </div>

          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
            aria-hidden="true"
          />

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              marginTop: '14px',
            }}
          >
            {!cameraActive ? (
              <button
                className="button primary"
                type="button"
                onClick={startCamera}
                disabled={processing}
              >
                <Camera />
                Turn on camera
              </button>
            ) : (
              <button
                className="button secondary"
                type="button"
                onClick={stopCamera}
                disabled={processing}
              >
                <CameraOff />
                Turn off camera
              </button>
            )}

            <button
              className="button secondary"
              type="button"
              onClick={captureFrame}
              disabled={!cameraActive || processing}
            >
              <Camera />
              Capture face
            </button>

            {capturedImage && (
              <button
                className="button secondary"
                type="button"
                onClick={retake}
                disabled={processing}
              >
                <RefreshCw />
                Retake
              </button>
            )}

            <button
              className="button primary"
              type="button"
              onClick={handleVerify}
              disabled={!capturedFile || processing}
            >
              {processing ? (
                <>
                  <Activity />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck />
                  Capture & Verify
                </>
              )}
            </button>
          </div>
        </div>

        <div>
          <div
            style={{
              border: '1px solid #d8e2ec',
              borderRadius: '9px',
              padding: '16px',
              background: '#f8fafc',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '12px' }}>
              Verification workflow
            </h3>

            <div className="detail-table">
              {[
                [
                  '1',
                  'Case selected',
                  caseId ? 'Ready' : 'Required',
                ],
                [
                  '2',
                  'Webcam capture',
                  capturedFile ? 'Captured' : cameraActive ? 'Ready' : 'Waiting',
                ],
                [
                  '3',
                  'Liveness analysis',
                  processing ? 'Running' : 'Runs during verification',
                ],
                [
                  '4',
                  'Face comparison',
                  processing ? 'Running' : 'Runs against document face',
                ],
                [
                  '5',
                  'Officer review',
                  'Required',
                ],
              ].map(([step, label, status]) => (
                <div className="detail-row" key={step}>
                  <span>{step}</span>
                  <strong>{label}</strong>
                  <Badge
                    className={
                      status === 'Ready' || status === 'Captured'
                        ? 'approved'
                        : 'review'
                    }
                  >
                    {status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {message && (
            <div
              style={{
                marginTop: '14px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #c7dceb',
                background: '#f2f8fc',
                color: '#174a70',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: '14px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #efcaca',
                background: '#fff5f5',
                color: '#8a2525',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              <strong>Verification error:</strong> {error}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: '16px',
          padding: '12px 14px',
          border: '1px solid #ead7a2',
          background: '#fff9e8',
          borderRadius: '8px',
          color: '#6b5a24',
          fontSize: '12px',
          lineHeight: 1.55,
        }}
      >
        <strong>Prototype privacy notice:</strong>{' '}
        use this camera workflow only with a consenting demonstration
        participant. The captured image is uploaded as a <em>live_photo</em>
        case document so the existing backend can perform liveness and
        face comparison. Automated results are decision-support signals
        and require authorised officer review.
      </div>
    </section>
  )
}

function Verification() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedCaseId = searchParams.get('caseId')
  const requestedStage = searchParams.get('stage')

  const [caseList, setCaseList] = useState<any[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState(requestedCaseId || '')
  const [verification, setVerification] = useState<any>(null)
  const [caseData, setCaseData] = useState<any>(null)
  const [selectedStage, setSelectedStage] = useState(requestedStage || 'ocr')
  const [loadingCases, setLoadingCases] = useState(true)
  const [loadingResult, setLoadingResult] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  // End-to-end officer workflow:
  // 1 Case selected -> 2 Documents -> 3 Automated screening
  // -> 4 Risk assessment -> 5 Officer decision.
  const [workflowStep, setWorkflowStep] = useState(2)
  const [officerDecision, setOfficerDecision] = useState('')
  const [officerRemarks, setOfficerRemarks] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')
  const [finalized, setFinalized] = useState(false)

  useEffect(() => {
    async function loadCases() {
      try {
        setLoadingCases(true)
        setError('')

        const response = await getCases()
        const availableCases = response?.cases || []
        setCaseList(availableCases)

        if (requestedCaseId) {
          setSelectedCaseId(requestedCaseId)
        } else if (availableCases.length > 0) {
          setSelectedCaseId(availableCases[0].id)
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load screening cases.',
        )
      } finally {
        setLoadingCases(false)
      }
    }

    loadCases()
  }, [requestedCaseId])

  async function loadVerification(caseId: string) {
    if (!caseId) {
      setVerification(null)
      setCaseData(null)
      setWorkflowStep(2)
      setOfficerDecision('')
      setOfficerRemarks('')
      setFinalized(false)
      return
    }

    try {
      setLoadingResult(true)
      setError('')

      const [caseResponse, verificationResponse] = await Promise.all([
        getCase(caseId),
        getVerificationResult(caseId).catch(() => null),
      ])

      const loadedCase = caseResponse?.case || null
      const loadedVerification =
        verificationResponse?.verificationResult || null

      setCaseData(loadedCase)
      setVerification(loadedVerification)

      const loadedReviewStatus = String(
        loadedCase?.reviewStatus || '',
      ).toLowerCase()

      const loadedDecision = String(
        loadedCase?.officerDecision || '',
      )

      setOfficerDecision(loadedDecision)
      setOfficerRemarks(loadedCase?.officerRemarks || '')
      setFinalized(
        loadedReviewStatus === 'completed' &&
        Boolean(loadedDecision),
      )

      if (loadedVerification) {
        if (
          loadedReviewStatus === 'completed' &&
          loadedDecision
        ) {
          setWorkflowStep(5)
        } else {
          setWorkflowStep(4)
          if (!requestedStage) {
            setSelectedStage('risk')
          }
        }
      } else {
        setWorkflowStep(2)
      }
    } catch (err) {
      console.error('Failed to load verification:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load verification results.',
      )
      setVerification(null)
    } finally {
      setLoadingResult(false)
    }
  }

  useEffect(() => {
    loadVerification(selectedCaseId)
  }, [selectedCaseId])

  useEffect(() => {
    if (requestedStage) {
      setSelectedStage(requestedStage)
    }
  }, [requestedStage])

  function changeCase(caseId: string) {
    setSelectedCaseId(caseId)
    setVerification(null)
    setCaseData(null)
    setWorkflowStep(2)
    setOfficerDecision('')
    setOfficerRemarks('')
    setFinalized(false)
    setReviewMessage('')

    const params = new URLSearchParams(searchParams.toString())
    params.set('caseId', caseId)
    router.replace(`/verification?${params.toString()}`)
  }

  async function handleAnalyze() {
    if (!selectedCaseId) return

    try {
      setAnalyzing(true)
      setError('')
      setReviewMessage('')
      setWorkflowStep(3)

      await analyzeCase(selectedCaseId)
      await loadVerification(selectedCaseId)

      // Screening is complete: automatically move the officer
      // to the risk-assessment stage.
      setWorkflowStep(4)
      setSelectedStage('risk')
      setReviewMessage(
        'Automated screening completed. Risk assessment is ready for officer review.',
      )
    } catch (err) {
      console.error('Verification analysis failed:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Automated screening could not be completed.',
      )
    } finally {
      setAnalyzing(false)
    }
  }

  function continueToOfficerDecision() {
    setWorkflowStep(5)
    setReviewMessage('')
    setError('')

    const params = new URLSearchParams(searchParams.toString())
    params.set('caseId', selectedCaseId)
    params.set('stage', 'risk')
    router.replace(`/verification?${params.toString()}`)
  }

  async function handleFinalizeCase() {
    if (!selectedCaseId) return

    if (!officerDecision) {
      setError('Select an officer decision before finalizing the case.')
      return
    }

    try {
      setReviewSaving(true)
      setError('')
      setReviewMessage('Saving officer decision and finalizing case...')

      const response = await updateCaseReview(selectedCaseId, {
        reviewStatus: 'completed',
        officerDecision,
        officerRemarks: officerRemarks.trim() || null,
      })

      const updatedCase = response?.case || null

      if (updatedCase) {
        setCaseData(updatedCase)
        setOfficerDecision(updatedCase.officerDecision || officerDecision)
        setOfficerRemarks(updatedCase.officerRemarks || officerRemarks)
      }

      setFinalized(true)
      setWorkflowStep(5)
      setReviewMessage(
        'Officer decision saved. The case has been finalized successfully.',
      )

      await loadVerification(selectedCaseId)
    } catch (err) {
      console.error('Case finalization failed:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to finalize the case.',
      )
      setReviewMessage('')
    } finally {
      setReviewSaving(false)
    }
  }

  const ocr = verification?.ocrResult
  const documentValidation = verification?.documentValidation
  const mrz = verification?.mrzResult
  const face = verification?.faceVerification
  const liveness = verification?.livenessAnalysis
  const tampering = verification?.tamperingAnalysis
  const crossDocument = verification?.crossDocumentAnalysis
  const riskAssessment = verification?.riskAssessment

  const riskScore =
    riskAssessment?.score ??
    riskAssessment?.riskScore ??
    riskAssessment?.levelScore ??
    caseData?.riskScore ??
    null

  const riskLevel =
    riskAssessment?.level ??
    riskAssessment?.riskLevel ??
    caseData?.riskLevel ??
    'Not assessed'

  const ocrFields =
    ocr?.fields && typeof ocr.fields === 'object'
      ? ocr.fields
      : {}

  const comparisonRows =
    crossDocument?.fieldComparisons ||
    documentValidation?.fieldComparisons ||
    []

  const mrzChecks =
    mrz?.result?.checks ||
    mrz?.checks ||
    documentValidation?.mrzChecks ||
    null

  const faceSimilarity =
    face?.similarity ??
    face?.similarityScore ??
    face?.matchScore ??
    face?.confidence ??
    null

  const livenessScore =
    liveness?.score ??
    liveness?.confidence ??
    liveness?.qualityScore ??
    null

  const stageDefinitions = [
    {
      key: 'ocr',
      name: 'OCR & Data Extraction',
      icon: FileText,
      data: ocr,
      status: ocr ? 'Completed' : 'Pending',
      summary: ocr
        ? `${Object.keys(ocrFields).length || 0} identity fields extracted from the submitted document.`
        : 'No OCR result is available for this case.',
      metric: null,
    },
    {
      key: 'face',
      name: 'Face Verification',
      icon: UserRound,
      data: face,
      status: face ? 'Review' : 'Pending',
      summary: face
        ? 'Face comparison result is available for authorised officer review.'
        : 'No face verification result is available.',
      metric: faceSimilarity,
    },
    {
      key: 'document',
      name: 'Document Validation',
      icon: FileCheck2,
      data: documentValidation,
      status: documentValidation ? 'Completed' : 'Pending',
      summary: documentValidation
        ? 'Document validity and consistency checks are available.'
        : 'No document validation result is available.',
      metric: null,
    },
    {
      key: 'mrz',
      name: 'MRZ Verification',
      icon: ClipboardCheck,
      data: mrz,
      status: mrz ? 'Completed' : 'Pending',
      summary: mrz
        ? 'Machine-readable zone structure and field checks are available.'
        : 'No MRZ result is available.',
      metric: null,
    },
    {
      key: 'liveness',
      name: 'Liveness Analysis',
      icon: ShieldCheck,
      data: liveness,
      status: liveness ? 'Review' : 'Pending',
      summary: liveness
        ? 'Liveness and image-quality indicators are available for review.'
        : 'No liveness analysis is available.',
      metric: livenessScore,
    },
    {
      key: 'tampering',
      name: 'Tampering Analysis',
      icon: AlertTriangle,
      data: tampering,
      status: tampering
        ? String(tampering.status || '').toLowerCase().includes('review')
          ? 'Review'
          : 'Completed'
        : 'Pending',
      summary: tampering
        ? 'Document integrity indicators are available for officer review.'
        : 'No tampering assessment is available.',
      metric: null,
    },
    {
      key: 'crossDocument',
      name: 'Cross-Document Consistency',
      icon: ClipboardCheck,
      data: crossDocument,
      status: crossDocument ? 'Completed' : 'Pending',
      summary: crossDocument
        ? 'Identity fields can be compared across submitted documents.'
        : 'No cross-document comparison is available.',
      metric: null,
    },
    {
      key: 'risk',
      name: 'Risk Assessment',
      icon: Gauge,
      data: riskAssessment,
      status: riskAssessment ? humanizeKey(String(riskLevel)) : 'Pending',
      summary: riskAssessment
        ? 'Rule-based risk information is available as decision support.'
        : 'Risk assessment has not been generated for this case.',
      metric: riskScore,
    },
  ]

  const selected =
    stageDefinitions.find((stage) => stage.key === selectedStage) ||
    stageDefinitions[0]

  function selectStage(key: string) {
    setSelectedStage(key)
    const params = new URLSearchParams(searchParams.toString())
    params.set('stage', key)
    if (selectedCaseId) params.set('caseId', selectedCaseId)
    router.replace(`/verification?${params.toString()}`)
  }

  const caseNumber =
    caseData?.caseNumber ||
    caseList.find((item) => item.id === selectedCaseId)?.caseNumber ||
    selectedCaseId ||
    'No case selected'

  const reviewStatus =
    caseData?.reviewStatus
      ? humanizeKey(String(caseData.reviewStatus))
      : 'Pending officer review'

  const renderSelectedResult = () => {
    // Face verification must remain usable even before a backend
    // verification result exists, because the officer needs to capture
    // the live face first. Other stages keep the existing empty-state flow.
    if (!selected.data && selected.key === 'face') {
      return (
        <div>
          <div className="empty-panel" style={{ marginBottom: '20px' }}>
            <Clock3 />
            <h3>No face verification result yet</h3>
            <p>
              Capture a live face below to upload the live photo, run
              liveness analysis, compare it with the identity document,
              and generate the verification result.
            </p>
          </div>

          <LiveFaceVerificationPanel
            caseId={selectedCaseId}
            onCompleted={() => loadVerification(selectedCaseId)}
          />
        </div>
      )
    }

    if (!selected.data) {
      return (
        <div className="empty-panel">
          <Clock3 />
          <h3>No result available</h3>
          <p>
            Run automated screening for this case to generate this
            verification result.
          </p>
          <button
            className="button primary"
            onClick={handleAnalyze}
            disabled={analyzing || !selectedCaseId}
          >
            <Activity />
            {analyzing ? 'Running screening...' : 'Run screening'}
          </button>
        </div>
      )
    }

    switch (selected.key) {
      case 'ocr':
        return (
          <div>
            <h3>Extracted identity information</h3>
            <div className="detail-table">
              {Object.entries(ocrFields).map(([key, value]) => (
                <div className="detail-row" key={key}>
                  <span>{humanizeKey(key)}</span>
                  <strong>{displayValue(value, key)}</strong>
                  <Badge className="approved">Extracted</Badge>
                </div>
              ))}
            </div>

            {ocr?.full_text && (
              <div
                style={{
                  marginTop: '18px',
                  padding: '16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: '#f8fafc',
                }}
              >
                <h3 style={{ marginTop: 0 }}>OCR text</h3>
                <p
                  style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.7,
                    marginBottom: 0,
                  }}
                >
                  {ocr.full_text}
                </p>
              </div>
            )}
          </div>
        )

      case 'document':
        return (
          <div>
            <h3>Document validation checks</h3>
            {documentValidation?.expiry && (
              <div className="detail-table">
                <div className="detail-row">
                  <span>Expiry validation</span>
                  <strong>
                    {humanizeKey(
                      String(
                        documentValidation.expiry.status || 'Checked',
                      ),
                    )}
                  </strong>
                  <ResultBadge
                    value={documentValidation.expiry.status}
                  />
                </div>
                {documentValidation.expiry.message && (
                  <div className="detail-row">
                    <span>Validation result</span>
                    <strong>
                      {documentValidation.expiry.message}
                    </strong>
                    <Badge className="approved">Available</Badge>
                  </div>
                )}
              </div>
            )}

            {mrzChecks && (
              <>
                <h3 style={{ marginTop: '22px' }}>
                  MRZ consistency checks
                </h3>
                <div className="detail-table">
                  {Object.entries(mrzChecks).map(([key, value]) => (
                    <div className="detail-row" key={key}>
                      <span>{humanizeKey(key)}</span>
                      <strong>{displayValue(value, key)}</strong>
                      <ResultBadge value={value} keyName={key} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )

      case 'mrz':
        return (
          <div>
            <h3>Machine-readable zone details</h3>
            <div className="detail-table">
              {mrz?.format && (
                <div className="detail-row">
                  <span>MRZ format</span>
                  <strong>{mrz.format}</strong>
                  <Badge className="approved">Detected</Badge>
                </div>
              )}
              {mrz?.result &&
                Object.entries(mrz.result)
                  .filter(([key]) => key !== 'checks')
                  .map(([key, value]) => (
                    <div className="detail-row" key={key}>
                      <span>{humanizeKey(key)}</span>
                      <strong>{displayValue(value, key)}</strong>
                      <Badge className="approved">Extracted</Badge>
                    </div>
                  ))}
            </div>

            {mrzChecks && (
              <>
                <h3 style={{ marginTop: '22px' }}>
                  Validation checks
                </h3>
                <div className="detail-table">
                  {Object.entries(mrzChecks).map(([key, value]) => (
                    <div className="detail-row" key={key}>
                      <span>{humanizeKey(key)}</span>
                      <strong>{displayValue(value, key)}</strong>
                      <ResultBadge value={value} keyName={key} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )

      case 'face':
        return (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              <div className="result-score">
                <span>Comparison result</span>
                <strong>
                  {face?.match !== undefined
                    ? face.match
                      ? 'Match'
                      : 'No match'
                    : 'Review'}
                </strong>
              </div>
              <div className="result-score">
                <span>Similarity / confidence</span>
                <strong>
                  {faceSimilarity !== null
                    ? `${faceSimilarity}%`
                    : 'Not reported'}
                </strong>
              </div>
            </div>
            <div className="detail-table">
              {face &&
                Object.entries(face)
                  .filter(
                    ([key, value]) =>
                      typeof value !== 'object' &&
                      value !== undefined &&
                      value !== null &&
                      !key.toLowerCase().includes('image'),
                  )
                  .map(([key, value]) => (
                    <div className="detail-row" key={key}>
                      <span>{humanizeKey(key)}</span>
                      <strong>{displayValue(value, key)}</strong>
                      <Badge className="review">Officer review</Badge>
                    </div>
                  ))}
            </div>

            <LiveFaceVerificationPanel
              caseId={selectedCaseId}
              onCompleted={() => loadVerification(selectedCaseId)}
            />
          </div>
        )

      case 'liveness':
        return (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              <div className="result-score">
                <span>Liveness assessment</span>
                <strong>
                  {liveness?.isLive !== undefined
                    ? liveness.isLive
                      ? 'Positive'
                      : 'Review'
                    : 'Review'}
                </strong>
              </div>
              <div className="result-score">
                <span>Reported confidence / score</span>
                <strong>
                  {livenessScore !== null
                    ? `${livenessScore}`
                    : 'Not reported'}
                </strong>
              </div>
            </div>
            <div className="detail-table">
              {liveness &&
                Object.entries(liveness)
                  .filter(
                    ([key, value]) =>
                      typeof value !== 'object' &&
                      value !== undefined &&
                      value !== null &&
                      !key.toLowerCase().includes('image') &&
                      !key.toLowerCase().includes('path'),
                  )
                  .map(([key, value]) => (
                    <div className="detail-row" key={key}>
                      <span>{humanizeKey(key)}</span>
                      <strong>{displayValue(value, key)}</strong>
                      <Badge className="review">Officer review</Badge>
                    </div>
                  ))}
            </div>
          </div>
        )

      case 'tampering':
        return <TamperingAssessment data={tampering} />

      case 'crossDocument':
        return (
          <div>
            <h3>Identity field comparison</h3>
            {comparisonRows.length > 0 ? (
              <ComparisonTable rows={comparisonRows} />
            ) : (
              <ReadableRows data={crossDocument} review />
            )}
          </div>
        )

      case 'risk':
        return (
          <div>
            <RiskAssessmentView
              data={riskAssessment}
              score={riskScore}
              level={riskLevel}
            />

            {riskAssessment && !finalized && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '18px',
                  border: '1px solid #c9dbea',
                  background: '#f5f9fc',
                  borderRadius: '8px',
                }}
              >
                <strong>Risk assessment completed</strong>
                <p
                  style={{
                    margin: '6px 0 14px',
                    color: '#5b6b7d',
                    lineHeight: 1.5,
                  }}
                >
                  Review the risk score and contributing factors, then
                  continue to the authorised officer decision.
                </p>
                <button
                  className="button primary"
                  type="button"
                  onClick={continueToOfficerDecision}
                >
                  <ClipboardCheck />
                  Continue to Officer Decision
                </button>
              </div>
            )}

            {finalized && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '14px 16px',
                  border: '1px solid #b9dfc9',
                  background: '#f0faf4',
                  borderRadius: '8px',
                  color: '#17633b',
                }}
              >
                <strong>Case finalized</strong>
                <div style={{ marginTop: '5px' }}>
                  Officer decision: {humanizeKey(officerDecision)}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <PageHeader
        title="Document Screening & Verification"
        description="Review automated document screening results for a selected case."
        action={
          <Badge className="review">
            {reviewStatus}
          </Badge>
        }
      />

      <div
        className="panel"
        style={{ marginBottom: '20px' }}
      >
        <div
          className="panel-heading"
          style={{ alignItems: 'center' }}
        >
          <div>
            <div className="eyebrow">Screening case</div>
            <h2 style={{ marginBottom: '4px' }}>
              {caseNumber}
            </h2>
            <p>
              Select a backend case to inspect its verification
              results.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <select
              aria-label="Select screening case"
              value={selectedCaseId}
              onChange={(event) =>
                changeCase(event.target.value)
              }
              disabled={loadingCases}
              style={{
                minWidth: '260px',
                padding: '10px 12px',
                border: '1px solid #d8e0e8',
                borderRadius: '7px',
                background: '#fff',
                color: '#25364a',
              }}
            >
              <option value="">
                {loadingCases
                  ? 'Loading cases...'
                  : 'Select a case'}
              </option>
              {caseList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.caseNumber || item.id}
                </option>
              ))}
            </select>

            <button
              className="button primary"
              onClick={handleAnalyze}
              disabled={
                analyzing ||
                loadingResult ||
                !selectedCaseId
              }
            >
              <Activity />
              {analyzing
                ? 'Screening...'
                : verification
                  ? 'Re-run screening'
                  : 'Run screening'}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: '14px',
              padding: '12px 14px',
              border: '1px solid #ead7a2',
              background: '#fff9e8',
              borderRadius: '7px',
              color: '#6b5a24',
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div className="stepper">
        <div className={`step ${workflowStep >= 1 ? 'done' : ''} ${workflowStep === 1 ? 'active' : ''}`}>
          <span>1</span>
          <b>Case selected</b>
        </div>
        <i />
        <div className={`step ${workflowStep >= 2 ? 'done' : ''} ${workflowStep === 2 ? 'active' : ''}`}>
          <span>2</span>
          <b>Documents</b>
        </div>
        <i />
        <div className={`step ${workflowStep >= 3 ? 'done' : ''} ${workflowStep === 3 ? 'active' : ''}`}>
          <span>3</span>
          <b>Automated screening</b>
        </div>
        <i />
        <div className={`step ${workflowStep >= 4 ? 'done' : ''} ${workflowStep === 4 ? 'active' : ''}`}>
          <span>4</span>
          <b>Risk assessment</b>
        </div>
        <i />
        <div className={`step ${workflowStep >= 5 ? 'done' : ''} ${workflowStep === 5 ? 'active' : ''}`}>
          <span>5</span>
          <b>Officer decision</b>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1100px) {
          .verification-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {loadingResult ? (
        <div className="panel">
          <div className="empty-panel">
            <Activity />
            <h2>Loading verification results...</h2>
            <p>
              Retrieving screening results from the
              Satyadristi backend.
            </p>
          </div>
        </div>
      ) : (
        workflowStep === 5 ? (
            <div
              className="panel"
              style={{
                border: finalized
                  ? '1px solid #b9dfc9'
                  : '1px solid #c9dbea',
                background: finalized ? '#f8fcfa' : '#fff',
                marginBottom: '0',
              }}
            >
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">Final officer review</div>
                  <h2 style={{ marginBottom: '4px' }}>
                    Officer Decision
                  </h2>
                  <p>
                    Review the automated screening and risk assessment
                    before recording the final case disposition.
                  </p>
                </div>

                <Badge className={finalized ? 'approved' : 'review'}>
                  {finalized ? 'Finalized' : 'Decision required'}
                </Badge>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'minmax(220px, 0.75fr) minmax(320px, 1.25fr)',
                  gap: '18px',
                  alignItems: 'start',
                }}
              >
                <div>
                  <label
                    htmlFor="officer-decision"
                    style={{
                      display: 'block',
                      marginBottom: '7px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#334155',
                    }}
                  >
                    Officer decision
                  </label>

                  <select
                    id="officer-decision"
                    value={officerDecision}
                    onChange={(event) =>
                      setOfficerDecision(event.target.value)
                    }
                    disabled={finalized || reviewSaving}
                    style={{
                      width: '100%',
                      padding: '11px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '7px',
                      background: '#fff',
                      color: '#25364a',
                    }}
                  >
                    <option value="">Select decision</option>
                    <option value="approved">Approve</option>
                    <option value="escalated">Escalate</option>
                    <option value="rejected">Reject</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="officer-remarks"
                    style={{
                      display: 'block',
                      marginBottom: '7px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#334155',
                    }}
                  >
                    Officer remarks
                  </label>

                  <textarea
                    id="officer-remarks"
                    value={officerRemarks}
                    onChange={(event) =>
                      setOfficerRemarks(event.target.value)
                    }
                    disabled={finalized || reviewSaving}
                    rows={4}
                    placeholder="Record the basis for the officer decision..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '7px',
                      background: '#fff',
                      color: '#25364a',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              {!finalized && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: '16px',
                  }}
                >
                  <button
                    className="button primary"
                    type="button"
                    onClick={handleFinalizeCase}
                    disabled={!officerDecision || reviewSaving}
                  >
                    {reviewSaving ? (
                      <>
                        <Activity />
                        Finalizing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 />
                        Save &amp; Finalize Case
                      </>
                    )}
                  </button>
                </div>
              )}

              {finalized && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px 14px',
                    borderRadius: '7px',
                    background: '#eefaf3',
                    border: '1px solid #b9dfc9',
                    color: '#17633b',
                    fontSize: '13px',
                  }}
                >
                  <strong>Final officer decision recorded.</strong>{' '}
                  The case is now marked as completed.
                </div>
              )}

              {reviewMessage && (
                <div
                  style={{
                    marginTop: '14px',
                    padding: '11px 13px',
                    borderRadius: '7px',
                    background: '#f2f8fc',
                    border: '1px solid #c7dceb',
                    color: '#174a70',
                    fontSize: '13px',
                  }}
                >
                  {reviewMessage}
                </div>
              )}
            </div>
          
        ) : (

        <div
          className="verification-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 380px) minmax(0, 1fr)',
            gap: '20px',
            width: '100%',
            alignItems: 'start',
          }}
        >
          <div
            className="analysis-list"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minWidth: 0,
              width: '100%',
            }}
          >
            {stageDefinitions.map((stage) => {
              const Icon = stage.icon
              const active =
                selectedStage === stage.key

              return (
                <button
                  key={stage.key}
                  className={`analysis-card ${
                    active ? 'selected' : ''
                  }`}
                  onClick={() =>
                    selectStage(stage.key)
                  }
                  style={{
                    width: '100%',
                    minWidth: 0,
                    display: 'grid',
                    gridTemplateColumns: '42px minmax(0, 1fr) auto 18px',
                    gap: '12px',
                    alignItems: 'center',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                  }}
                >
                  <div className="analysis-icon">
                    <Icon />
                  </div>

                  <div
                    className="analysis-main"
                    style={{ minWidth: 0, overflow: 'hidden' }}
                  >
                    <div>
                      <strong>{stage.name}</strong>
                      <Badge
                        className={
                          stage.status === 'Completed'
                            ? 'approved'
                            : 'review'
                        }
                      >
                        {stage.status}
                      </Badge>
                    </div>

                    <p>{stage.summary}</p>

                    <small>
                      {stage.data
                        ? 'Result available'
                        : 'Awaiting screening'}
                    </small>
                  </div>

                  <div
                    className="score"
                    style={{ minWidth: '68px', textAlign: 'right' }}
                  >
                    {stage.metric !== null &&
                    stage.metric !== undefined
                      ? stage.key === 'risk'
                        ? `${stage.metric}/100`
                        : `${stage.metric}%`
                      : '—'}
                    <small>
                      {stage.key === 'risk'
                        ? 'risk score'
                        : 'reported score'}
                    </small>
                  </div>

                  <ChevronRight />
                </button>
              )
            })}
          </div>



          <div
            className="panel result-panel"
            style={{
              minWidth: 0,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div className="panel-heading">
              <div>
                <div className="eyebrow">
                  Verification result
                </div>
                <h2>{selected.name}</h2>
                <p>{selected.summary}</p>
              </div>

              <Badge
                className={
                  selected.status === 'Completed'
                    ? 'approved'
                    : 'review'
                }
              >
                {selected.status}
              </Badge>
            </div>

            {renderSelectedResult()}

            <div
              style={{
                marginTop: '22px',
                padding: '14px 16px',
                border: '1px solid #ead7a2',
                background: '#fff9e8',
                borderRadius: '8px',
                color: '#6b5a24',
                fontSize: '13px',
                lineHeight: 1.6,
              }}
            >
              <strong>Officer review required:</strong>{' '}
              automated screening outputs are decision-support
              information. Final case disposition must be made by
              an authorised officer after reviewing the available
              evidence.
            </div>
          </div>
        </div>

        )
      )}
    </>
  )
}

function CasesPage() { return <><PageHeader title="Case Management" description="Search, filter and review document screening cases." action={<button className="button primary"><Upload />New screening case</button>} /><div className="filter-strip"><div className="filter-label"><SlidersHorizontal />Filters</div><select aria-label="Risk filter"><option>All risk levels</option><option>Low</option><option>Medium</option><option>High</option></select><select aria-label="Country filter"><option>All countries</option><option>India</option><option>USA</option><option>UAE</option></select><select aria-label="Document filter"><option>All documents</option><option>Passport</option><option>Passport + Visa</option><option>National ID</option></select><button className="button secondary">Reset filters</button></div><CasesTable /></> }

function humanizeKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function displayValue(value: any, key = '') {
  if (value === null || value === undefined || value === '') {
    return 'Not available'
  }

  if (typeof value === 'boolean') {
    const lower = key.toLowerCase()

    if (
      value &&
      (
        lower.includes('match') ||
        lower.includes('valid') ||
        lower.includes('check') ||
        lower.includes('consistent') ||
        lower.includes('detected') ||
        lower.includes('composite') ||
        lower.includes('structure')
      )
    ) {
      return 'Passed'
    }

    if (
      !value &&
      (
        lower.includes('match') ||
        lower.includes('valid') ||
        lower.includes('check') ||
        lower.includes('consistent')
      )
    ) {
      return 'Not passed'
    }

    return value ? 'Yes' : 'No'
  }

  return String(value)
}

function ResultBadge({
  value,
  keyName = '',
  review = false,
}: {
  value: any
  keyName?: string
  review?: boolean
}) {
  const text = displayValue(value, keyName).toLowerCase()

  if (
    review ||
    text.includes('review') ||
    text.includes('warning') ||
    text.includes('pending') ||
    text.includes('not passed') ||
    text.includes('mismatch') ||
    text.includes('failed')
  ) {
    return <Badge className="review">{displayValue(value, keyName)}</Badge>
  }

  if (
    text.includes('passed') ||
    text.includes('valid') ||
    text.includes('match') ||
    text === 'yes' ||
    text === 'true' ||
    text.includes('consistent') ||
    text.includes('completed')
  ) {
    return <Badge className="approved">{displayValue(value, keyName)}</Badge>
  }

  return <Badge className="approved">Available</Badge>
}

function ReadableRows({
  data,
  review = false,
  exclude = [],
}: {
  data: any
  review?: boolean
  exclude?: string[]
}) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null
  }

  return (
    <div className="detail-table">
      {Object.entries(data)
        .filter(([key]) => !exclude.includes(key))
        .map(([key, value]) => {
          if (
            value !== null &&
            typeof value === 'object' &&
            !Array.isArray(value)
          ) {
            return (
              <div key={key}>
                <div
                  style={{
                    padding: '14px 0 8px',
                    fontWeight: 700,
                    color: '#183b63',
                    borderBottom: '1px solid #e5eaf0',
                  }}
                >
                  {humanizeKey(key)}
                </div>
                <ReadableRows
                  data={value}
                  review={review}
                />
              </div>
            )
          }

          return (
            <div className="detail-row" key={key}>
              <span>{humanizeKey(key)}</span>
              <strong>
                {Array.isArray(value)
                  ? `${value.length} item${value.length === 1 ? '' : 's'}`
                  : displayValue(value, key)}
              </strong>
              <em>System</em>
              <ResultBadge
                value={value}
                keyName={key}
                review={review}
              />
            </div>
          )
        })}
    </div>
  )
}

function ComparisonTable({
  rows,
}: {
  rows: any[]
}) {
  if (!rows?.length) return null

  return (
    <div
      style={{
        overflowX: 'auto',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
        }}
      >
        <thead>
          <tr>
            <th style={tableHeadStyle}>Field</th>
            <th style={tableHeadStyle}>Document / MRZ</th>
            <th style={tableHeadStyle}>OCR / Extracted</th>
            <th style={tableHeadStyle}>Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.field || 'field'}-${index}`}>
              <td style={tableCellStyle}>
                {humanizeKey(String(row.field || 'Unknown'))}
              </td>
              <td style={tableCellStyle}>
                {displayValue(
                  row.mrzValue ?? row.documentValue,
                  'value',
                )}
              </td>
              <td style={tableCellStyle}>
                {displayValue(
                  row.ocrValue ?? row.extractedValue,
                  'value',
                )}
              </td>
              <td style={tableCellStyle}>
                <ResultBadge
                  value={row.status || row.result}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const tableHeadStyle: CSSProperties = {
  padding: '12px 14px',
  textAlign: 'left',
  background: '#f6f8fb',
  borderBottom: '1px solid #dfe5ec',
  color: '#52657a',
  fontWeight: 700,
}

const tableCellStyle: CSSProperties = {
  padding: '12px 14px',
  borderBottom: '1px solid #edf0f4',
  verticalAlign: 'top',
}

function VerificationSection({
  title,
  description,
  data,
  review = false,
  children,
}: {
  title: string
  description: string
  data: any
  review?: boolean
  children?: ReactNode
}) {
  const available = data !== null && data !== undefined

  return (
    <section className="panel" style={{ marginTop: '20px' }}>
      <div className="panel-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        <Badge className={review || !available ? 'review' : 'approved'}>
          {!available
            ? 'Pending'
            : review
              ? 'Officer review'
              : 'Completed'}
        </Badge>
      </div>

      {available ? (
        children
      ) : (
        <div className="detail-table">
          <div className="detail-row">
            <span>System result</span>
            <strong>Not available</strong>
            <em>System</em>
            <Badge className="review">Pending</Badge>
          </div>
        </div>
      )}
    </section>
  )
}


function TamperingAssessment({ data }: { data: any }) {
  if (!data || typeof data !== 'object') {
    return (
      <div className="empty-panel">
        <AlertTriangle />
        <h3>No tampering assessment available</h3>
        <p>Run automated screening to populate document integrity indicators.</p>
      </div>
    )
  }

  const status = String(data.status || data.assessment || 'requires_review')
  const statusText = humanizeKey(status)
  const indicators = Array.isArray(data.indicators)
    ? data.indicators
    : Array.isArray(data.findings)
      ? data.findings
      : []

  const metricItems = [
    ['Image sharpness', data.sharpness],
    ['Image brightness', data.brightness],
    ['Edge density', data.edgeDensity],
  ].filter(([, value]) => value !== undefined && value !== null)

  const reviewRequired =
    data.requiresOfficerReview === true ||
    status.toLowerCase().includes('review') ||
    status.toLowerCase().includes('warning')

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {metricItems.map(([label, value]) => (
          <div
            key={String(label)}
            style={{
              padding: '16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: '#f8fafc',
            }}
          >
            <span style={{ display: 'block', color: '#64748b', fontSize: '12px', marginBottom: '7px' }}>
              {label}
            </span>
            <strong style={{ fontSize: '20px', color: '#25364a' }}>
              {typeof value === 'number' ? value.toFixed(2) : String(value)}
            </strong>
          </div>
        ))}
      </div>

      <div className="detail-table">
        <div className="detail-row">
          <span>Assessment</span>
          <strong>{statusText}</strong>
          <ResultBadge value={status} />
        </div>

        <div className="detail-row">
          <span>Analysis completed</span>
          <strong>{data.analysisCompleted === false ? 'No' : 'Yes'}</strong>
          <ResultBadge value={data.analysisCompleted === false ? false : true} keyName="analysisCompleted" />
        </div>

        <div className="detail-row">
          <span>Officer review</span>
          <strong>{reviewRequired ? 'Required' : 'Not specifically required'}</strong>
          <Badge className={reviewRequired ? 'review' : 'approved'}>
            {reviewRequired ? 'Review required' : 'No additional flag'}
          </Badge>
        </div>
      </div>

      {indicators.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ margin: '0 0 10px', color: '#183b63' }}>
            Detection indicators
          </h4>
          <div className="detail-table">
            {indicators.map((item: any, index: number) => {
              const label =
                typeof item === 'string'
                  ? item
                  : item?.name || item?.indicator || item?.description || `Indicator ${index + 1}`

              const result =
                typeof item === 'string'
                  ? 'Detected'
                  : item?.status || item?.result || item?.value || 'Review'

              return (
                <div className="detail-row" key={`${label}-${index}`}>
                  <span>{humanizeKey(String(label))}</span>
                  <strong>{displayValue(result)}</strong>
                  <ResultBadge value={result} review />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {indicators.length === 0 && (
        <div
          style={{
            marginTop: '18px',
            padding: '14px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: '#f8fafc',
            color: '#52657a',
            fontSize: '13px',
          }}
        >
          No individual tampering indicators were returned by the screening service.
        </div>
      )}
    </div>
  )
}

function RiskAssessmentView({
  data,
  score,
  level,
}: {
  data: any
  score: any
  level: any
}) {
  const factors = Array.isArray(data?.factors)
    ? data.factors
    : Array.isArray(data?.riskFactors)
      ? data.riskFactors
      : Array.isArray(data?.flags)
        ? data.flags
        : []

  const normalizedLevel = String(level || 'Not assessed')
  const levelLower = normalizedLevel.toLowerCase()

  const levelClass =
    levelLower.includes('high')
      ? 'danger'
      : levelLower.includes('medium')
        ? 'review'
        : levelLower.includes('low')
          ? 'approved'
          : 'review'

  const reviewRequired =
    data?.requiresOfficerReview === true ||
    levelLower.includes('high') ||
    levelLower.includes('medium') ||
    levelLower.includes('review')

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            padding: '18px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: '#f8fafc',
          }}
        >
          <span style={{ display: 'block', color: '#64748b', fontSize: '12px', marginBottom: '7px' }}>
            Risk score
          </span>
          <strong style={{ fontSize: '30px', color: '#183b63' }}>
            {score ?? '—'} <small style={{ fontSize: '14px', color: '#64748b' }}>/ 100</small>
          </strong>
        </div>

        <div
          style={{
            padding: '18px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: '#f8fafc',
          }}
        >
          <span style={{ display: 'block', color: '#64748b', fontSize: '12px', marginBottom: '7px' }}>
            Risk level
          </span>
          <Badge className={levelClass}>{humanizeKey(normalizedLevel)}</Badge>
        </div>

        <div
          style={{
            padding: '18px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: '#f8fafc',
          }}
        >
          <span style={{ display: 'block', color: '#64748b', fontSize: '12px', marginBottom: '7px' }}>
            Review requirement
          </span>
          <strong style={{ fontSize: '18px', color: '#25364a' }}>
            {reviewRequired ? 'Officer review' : 'Routine review'}
          </strong>
        </div>
      </div>

      {factors.length > 0 ? (
        <div>
          <h4 style={{ margin: '0 0 10px', color: '#183b63' }}>
            Risk factors
          </h4>
          <div className="detail-table">
            {factors.map((factor: any, index: number) => {
              const name =
                typeof factor === 'string'
                  ? factor
                  : factor?.factor || factor?.name || factor?.reason || factor?.description || `Risk factor ${index + 1}`

              const impact =
                typeof factor === 'object' && factor
                  ? factor.score ?? factor.points ?? factor.impact ?? factor.weight
                  : null

              return (
                <div className="detail-row" key={`${name}-${index}`}>
                  <span>{humanizeKey(String(name))}</span>
                  <strong>{impact !== null && impact !== undefined ? String(impact) : 'Review indicator'}</strong>
                  <Badge className="review">Review</Badge>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '14px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: '#f8fafc',
            color: '#52657a',
            fontSize: '13px',
          }}
        >
          No individual risk factors were returned. Review the underlying screening evidence before recording a case decision.
        </div>
      )}

      <div
        style={{
          marginTop: '18px',
          padding: '14px 16px',
          border: '1px solid #ead7a2',
          background: '#fff9e8',
          borderRadius: '8px',
          color: '#6b5a24',
          fontSize: '13px',
          lineHeight: 1.6,
        }}
      >
        <strong>Decision-support notice:</strong>{' '}
        the risk score is an automated screening indicator. It should be considered together with the underlying evidence and reviewed by an authorised officer before a final case disposition.
      </div>
    </div>
  )
}

function VerificationResults({ verification }: { verification: any }) {
  const ocr = verification?.ocrResult
  const documentValidation = verification?.documentValidation
  const mrz = verification?.mrzResult
  const face = verification?.faceVerification
  const liveness = verification?.livenessAnalysis
  const tampering = verification?.tamperingAnalysis
  const crossDocument = verification?.crossDocumentAnalysis
  const riskAssessment = verification?.riskAssessment

  const ocrFields =
    ocr?.fields && typeof ocr.fields === 'object'
      ? ocr.fields
      : null

  const mrzChecks =
    mrz?.result?.checks ||
    mrz?.checks ||
    documentValidation?.mrzChecks ||
    null

  const comparisonRows =
    crossDocument?.fieldComparisons ||
    documentValidation?.fieldComparisons ||
    []

  const riskScore =
    riskAssessment?.score ??
    riskAssessment?.riskScore ??
    riskAssessment?.levelScore

  const riskLevel =
    riskAssessment?.level ??
    riskAssessment?.riskLevel ??
    'Not available'

  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Verification results</h2>
            <p>
              Structured screening results generated by the
              Satyadristi verification pipeline.
            </p>
          </div>

          <Badge className="review">
            Officer review required
          </Badge>
        </div>

        <div className="detail-table">
          <div className="detail-row">
            <span>Screening status</span>
            <strong>
              {humanizeKey(
                String(verification?.status || 'Completed'),
              )}
            </strong>
            <em>System</em>
            <Badge className="approved">Completed</Badge>
          </div>

          <div className="detail-row">
            <span>OCR & data extraction</span>
            <strong>{ocr ? 'Completed' : 'Pending'}</strong>
            <em>System</em>
            <Badge className={ocr ? 'approved' : 'review'}>
              {ocr ? 'Available' : 'Pending'}
            </Badge>
          </div>

          <div className="detail-row">
            <span>Document validation</span>
            <strong>
              {documentValidation ? 'Completed' : 'Pending'}
            </strong>
            <em>System</em>
            <Badge
              className={
                documentValidation ? 'approved' : 'review'
              }
            >
              {documentValidation ? 'Available' : 'Pending'}
            </Badge>
          </div>

          <div className="detail-row">
            <span>MRZ validation</span>
            <strong>{mrz ? 'Detected' : 'Pending'}</strong>
            <em>System</em>
            <Badge className={mrz ? 'approved' : 'review'}>
              {mrz ? 'Available' : 'Pending'}
            </Badge>
          </div>

          <div className="detail-row">
            <span>Face verification</span>
            <strong>{face ? 'Result available' : 'Not available'}</strong>
            <em>Decision support</em>
            <Badge className="review">Officer review</Badge>
          </div>

          <div className="detail-row">
            <span>Liveness analysis</span>
            <strong>{liveness ? 'Result available' : 'Not available'}</strong>
            <em>Decision support</em>
            <Badge className="review">Officer review</Badge>
          </div>

          <div className="detail-row">
            <span>Tampering analysis</span>
            <strong>{tampering ? 'Result available' : 'Not available'}</strong>
            <em>Decision support</em>
            <Badge className="review">Officer review</Badge>
          </div>

          <div className="detail-row">
            <span>Cross-document analysis</span>
            <strong>
              {crossDocument ? 'Result available' : 'Not available'}
            </strong>
            <em>System</em>
            <Badge className={crossDocument ? 'approved' : 'review'}>
              {crossDocument ? 'Available' : 'Pending'}
            </Badge>
          </div>
        </div>
      </section>

      <VerificationSection
        title="OCR & extracted information"
        description="Identity and document fields extracted from the submitted document."
        data={ocr}
      >
        <div className="detail-table">
          {ocrFields &&
            Object.entries(ocrFields).map(([key, value]) => (
              <div className="detail-row" key={key}>
                <span>{humanizeKey(key)}</span>
                <strong>{displayValue(value, key)}</strong>
                <em>OCR</em>
                <ResultBadge value={value} keyName={key} />
              </div>
            ))}
        </div>

        {ocr?.full_text && (
          <div
            style={{
              marginTop: '18px',
              padding: '16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#52657a',
                marginBottom: '8px',
              }}
            >
              OCR text
            </div>
            <div
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.7,
                color: '#25364a',
              }}
            >
              {ocr.full_text}
            </div>
          </div>
        )}
      </VerificationSection>

      <VerificationSection
        title="Document validation"
        description="Validity and consistency checks applied to the document."
        data={documentValidation}
      >
        {documentValidation?.expiry && (
          <div className="detail-table">
            <div className="detail-row">
              <span>Expiry validation</span>
              <strong>
                {humanizeKey(
                  String(documentValidation.expiry.status || 'Checked'),
                )}
              </strong>
              <em>System</em>
              <ResultBadge
                value={documentValidation.expiry.status}
              />
            </div>

            {documentValidation.expiry.message && (
              <div className="detail-row">
                <span>Validation message</span>
                <strong>{documentValidation.expiry.message}</strong>
                <em>System</em>
                <Badge className="approved">Available</Badge>
              </div>
            )}
          </div>
        )}

        {mrzChecks && (
          <>
            <h4 style={{ margin: '22px 0 10px' }}>MRZ consistency checks</h4>
            <div className="detail-table">
              {Object.entries(mrzChecks).map(([key, value]) => (
                <div className="detail-row" key={key}>
                  <span>{humanizeKey(key)}</span>
                  <strong>{displayValue(value, key)}</strong>
                  <em>System</em>
                  <ResultBadge value={value} keyName={key} />
                </div>
              ))}
            </div>
          </>
        )}
      </VerificationSection>

      <VerificationSection
        title="MRZ verification"
        description="Machine-readable zone detection, structure and field validation."
        data={mrz}
      >
        <div className="detail-table">
          {mrz?.format && (
            <div className="detail-row">
              <span>MRZ format</span>
              <strong>{mrz.format}</strong>
              <em>System</em>
              <Badge className="approved">Detected</Badge>
            </div>
          )}

          {mrz?.detected !== undefined && (
            <div className="detail-row">
              <span>MRZ detected</span>
              <strong>{displayValue(mrz.detected, 'detected')}</strong>
              <em>System</em>
              <ResultBadge value={mrz.detected} keyName="detected" />
            </div>
          )}

          {mrz?.result?.surname && (
            <div className="detail-row">
              <span>Surname</span>
              <strong>{mrz.result.surname}</strong>
              <em>MRZ</em>
              <Badge className="approved">Extracted</Badge>
            </div>
          )}

          {mrz?.result?.givenNames && (
            <div className="detail-row">
              <span>Given names</span>
              <strong>{mrz.result.givenNames}</strong>
              <em>MRZ</em>
              <Badge className="approved">Extracted</Badge>
            </div>
          )}

          {mrz?.result?.passportNumber && (
            <div className="detail-row">
              <span>Passport number</span>
              <strong>{mrz.result.passportNumber}</strong>
              <em>MRZ</em>
              <Badge className="approved">Extracted</Badge>
            </div>
          )}

          {mrz?.result?.dateOfBirth && (
            <div className="detail-row">
              <span>Date of birth</span>
              <strong>{mrz.result.dateOfBirth}</strong>
              <em>MRZ</em>
              <Badge className="approved">Extracted</Badge>
            </div>
          )}

          {mrz?.result?.expiryDate && (
            <div className="detail-row">
              <span>Expiry date</span>
              <strong>{mrz.result.expiryDate}</strong>
              <em>MRZ</em>
              <Badge className="approved">Extracted</Badge>
            </div>
          )}
        </div>

        {mrzChecks && (
          <>
            <h4 style={{ margin: '22px 0 10px' }}>Validation checks</h4>
            <div className="detail-table">
              {Object.entries(mrzChecks).map(([key, value]) => (
                <div className="detail-row" key={key}>
                  <span>{humanizeKey(key)}</span>
                  <strong>{displayValue(value, key)}</strong>
                  <em>System</em>
                  <ResultBadge value={value} keyName={key} />
                </div>
              ))}
            </div>
          </>
        )}
      </VerificationSection>

      <VerificationSection
        title="Face verification"
        description="Comparison of the available face evidence. This result is decision support and requires officer review."
        data={face}
        review
      >
        <ReadableRows
          data={face}
          review
          exclude={['image', 'imageData', 'embedding']}
        />
      </VerificationSection>

      <VerificationSection
        title="Liveness analysis"
        description="Assessment of available image and face-quality signals. This is not a standalone identity decision."
        data={liveness}
        review
      >
        <ReadableRows
          data={liveness}
          review
          exclude={['image', 'imageData', 'embedding']}
        />
      </VerificationSection>

      <VerificationSection
        title="Tampering analysis"
        description="Document integrity indicators identified by the screening service."
        data={tampering}
        review
      >
        <TamperingAssessment data={tampering} />
      </VerificationSection>

      <VerificationSection
        title="Cross-document consistency"
        description="Comparison of identity fields available across submitted documents."
        data={crossDocument}
      >
        {comparisonRows.length > 0 ? (
          <ComparisonTable rows={comparisonRows} />
        ) : (
          <ReadableRows data={crossDocument} />
        )}
      </VerificationSection>

      <VerificationSection
        title="Risk assessment"
        description="Rule-based screening summary for officer decision support."
        data={riskAssessment}
        review
      >
        <RiskAssessmentView
          data={riskAssessment}
          score={riskScore}
          level={riskLevel}
        />
      </VerificationSection>

      <div
        style={{
          marginTop: '20px',
          padding: '14px 16px',
          border: '1px solid #ead7a2',
          background: '#fff9e8',
          borderRadius: '8px',
          color: '#6b5a24',
          fontSize: '13px',
          lineHeight: 1.6,
        }}
      >
        <strong>Officer review required:</strong>{' '}
        automated screening outputs are decision-support information.
        Final case disposition must be made by an authorised officer
        after reviewing the available evidence.
      </div>
    </>
  )
}

function CaseDetails({ id }: { id: string }) {
  const [caseData, setCaseData] =
    useState<any>(null)

  const [verification, setVerification] =
    useState<any>(null)

  const [auditLogs, setAuditLogs] =
    useState<any[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')
  const [analyzing, setAnalyzing] =
  useState(false)

const [analysisMessage, setAnalysisMessage] =
  useState('')
const [reviewStatus, setReviewStatus] = useState("pending")
const [officerDecision, setOfficerDecision] = useState("")
const [officerRemarks, setOfficerRemarks] = useState("")
const [reviewSaving, setReviewSaving] = useState(false)
const [reviewMessage, setReviewMessage] = useState("")

async function handleAnalyze() {
  try {
    setAnalyzing(true)
    setAnalysisMessage('')
    setError('')

    await analyzeCase(id)

    setAnalysisMessage(
      'Automated screening completed successfully.',
    )

    // Refresh the case details
    const [
      caseResponse,
      verificationResponse,
      auditResponse,
    ] = await Promise.all([
      getCase(id),
      getVerificationResult(id).catch(
        () => null,
      ),
      getAuditLogs(id).catch(
        () => null,
      ),
    ])

    setCaseData(caseResponse.case)
    setReviewStatus(caseResponse.case.reviewStatus || 'pending')
    setOfficerDecision(caseResponse.case.officerDecision || '')
    setOfficerRemarks(caseResponse.case.officerRemarks || '')

    if (
      verificationResponse?.verificationResult
    ) {
      setVerification(
        verificationResponse.verificationResult,
      )
    }

    if (auditResponse?.auditLogs) {
      setAuditLogs(
        auditResponse.auditLogs,
      )
    }
  } catch (err) {
    console.error(
      'Case analysis failed:',
      err,
    )

    setError(
      err instanceof Error
        ? err.message
        : 'Automated screening failed.',
    )
  } finally {
    setAnalyzing(false)
  }
}

  async function handleSaveReview() {
    try {
      setReviewSaving(true)
      setReviewMessage('')
      setError('')

      const response = await updateCaseReview(id, {
        reviewStatus,
        officerDecision: officerDecision || null,
        officerRemarks: officerRemarks.trim() || null,
      })

      if (response?.case) {
        setCaseData(response.case)
        setReviewStatus(response.case.reviewStatus || reviewStatus)
        setOfficerDecision(response.case.officerDecision || '')
        setOfficerRemarks(response.case.officerRemarks || '')
      }

      const auditResponse = await getAuditLogs(id).catch(() => null)
      if (auditResponse?.auditLogs) {
        setAuditLogs(auditResponse.auditLogs)
      }

      setReviewMessage('Officer review saved successfully.')
    } catch (err) {
      console.error('Officer review update failed:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save officer review.',
      )
    } finally {
      setReviewSaving(false)
    }
  }

  useEffect(() => {
    async function loadCaseDetails() {
      try {
        setLoading(true)
        setError('')

        const [
          caseResponse,
          verificationResponse,
          auditResponse,
        ] = await Promise.all([
          getCase(id),
          getVerificationResult(id).catch(
            () => null,
          ),
          getAuditLogs(id).catch(
            () => null,
          ),
        ])

        setCaseData(
          caseResponse.case,
        )

        if (
          verificationResponse?.verificationResult
        ) {
          setVerification(
            verificationResponse.verificationResult,
          )
        }

        if (
          auditResponse?.auditLogs
        ) {
          setAuditLogs(
            auditResponse.auditLogs,
          )
        }
      } catch (err) {
        console.error(
          'Failed to load case details:',
          err,
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load case details.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadCaseDetails()
  }, [id])

  // -------------------------------------------------------
  // Loading
  // -------------------------------------------------------

  if (loading) {
    return (
      <>
        <PageHeader
          title="Case Details"
          description="Loading case information..."
        />

        <div className="empty-panel">
          <Activity />

          <h2>
            Loading case
          </h2>

          <p>
            Retrieving case information
            from the Satyadristi backend.
          </p>
        </div>
      </>
    )
  }

  // -------------------------------------------------------
  // Error
  // -------------------------------------------------------

  if (error || !caseData) {
    return (
      <>
        <PageHeader
          title="Case Details"
          description="Unable to retrieve the requested case."
        />

        <div className="empty-panel">
          <AlertTriangle />

          <h2>
            Case not found
          </h2>

          <p>
            {error ||
              'The requested case could not be found.'}
          </p>

          <button
            className="button primary"
            onClick={() =>
              window.history.back()
            }
          >
            Return to Cases
          </button>
        </div>
      </>
    )
  }

  // -------------------------------------------------------
  // Case values
  // -------------------------------------------------------

  const risk =
    caseData.riskScore

  const riskLevel =
    caseData.riskLevel ||
    'Not assessed'

  
  const createdDate =
    caseData.createdAt
      ? new Date(
          caseData.createdAt,
        ).toLocaleDateString(
          'en-IN',
          {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          },
        )
      : '—'

  const updatedDate =
    caseData.updatedAt
      ? new Date(
          caseData.updatedAt,
        ).toLocaleDateString(
          'en-IN',
          {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          },
        )
      : '—'

  return (
    <>
      <PageHeader
        eyebrow="Case details"
        title={caseData.caseNumber}
        description="Complete case record and screening evidence."
        action={
          <div className="header-actions">

            <Badge
              className={
                reviewStatus.toLowerCase() ===
                'approved'
                  ? 'approved'
                  : 'review'
              }
            >
              {reviewStatus}
            </Badge>

            {caseData.reportPath && (
              <a
                className="button secondary"
                href={
                  getReportPdfUrl(
                    caseData.id,
                  )
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download />
                View PDF
              </a>
            )}

            {!verification && (
  <button
    className="button primary"
    onClick={handleAnalyze}
    disabled={analyzing}
  >
    {analyzing ? (
      <>
        <Activity />
        Screening in progress...
      </>
    ) : (
      <>
        <ShieldCheck />
        Run Automated Screening
      </>
    )}
  </button>
)}

{verification && (
  <button
    className="button primary"
    onClick={handleAnalyze}
    disabled={analyzing}
  >
    {analyzing ? (
      <>
        <Activity />
        Re-running screening...
      </>
    ) : (
      <>
        <ShieldCheck />
        Run Screening Again
      </>
    )}
  </button>
)}

          </div>
        }
      />
    {analysisMessage && (
  <div className="finding-box">
    <h3>
      <CheckCircle2 />
      Screening completed
    </h3>

    <p>{analysisMessage}</p>
  </div>
)}
      {/* =================================================
          CASE OVERVIEW
      ================================================= */}

      <div className="case-overview">

        <div>
          <span>
            Case number
          </span>

          <strong>
            {caseData.caseNumber}
          </strong>
        </div>

        <div>
          <span>
            Status
          </span>

          <strong>
            {caseData.status}
          </strong>
        </div>

        <div>
          <span>
            Risk score
          </span>

          <strong
            className={
              risk !== null
                ? riskClass(risk)
                : ''
            }
          >
            {risk !== null
              ? `${risk} / 100`
              : 'Not assessed'}
          </strong>
        </div>

        <div>
          <span>
            Risk level
          </span>

          <strong>
            {riskLevel}
          </strong>
        </div>

        <div>
          <span>
            Review status
          </span>

          <strong>
            {reviewStatus}
          </strong>
        </div>

      </div>

      {/* =================================================
          TABS
      ================================================= */}

      <div className="tabs">
        <button className="active">
          Overview
        </button>

        <button>
          Documents
        </button>

        <button>
          Verification
        </button>

        <button>
          Risk assessment
        </button>

        <button>
          Investigation report
        </button>

        <button>
          Audit trail
        </button>
      </div>

      {/* =================================================
          MAIN CASE GRID
      ================================================= */}

      <div className="case-grid">

        {/* ---------------------------------------------
            Screening Summary
        --------------------------------------------- */}

        <div className="panel">

          <div className="panel-heading">
            <div>
              <h2>
                Screening summary
              </h2>

              <p>
                Automated screening results
                for {caseData.caseNumber}.
              </p>
            </div>
          </div>

          <div className="summary-list">

            <div>
              <span className="check">
                <CheckCircle2 />
              </span>

              <strong>
                OCR & Data Extraction
              </strong>

              <span>
                {verification?.ocrResult
                  ? 'Completed'
                  : 'Pending'}
              </span>

              <ArrowUpRight />
            </div>

            <div>
              <span className="check">
                <CheckCircle2 />
              </span>

              <strong>
                MRZ Validation
              </strong>

              <span>
                {verification?.mrzResult
                  ? 'Completed'
                  : 'Pending'}
              </span>

              <ArrowUpRight />
            </div>

            <div>
              <span className="check">
                <CheckCircle2 />
              </span>

              <strong>
                Document Validation
              </strong>

              <span>
                {verification?.documentValidation
                  ? 'Completed'
                  : 'Pending'}
              </span>

              <ArrowUpRight />
            </div>

            <div>
              <span className="check">
                <CheckCircle2 />
              </span>

              <strong>
                Face Verification
              </strong>

              <span>
                {verification?.faceVerification
                  ? 'Completed'
                  : 'Not available'}
              </span>

              <ArrowUpRight />
            </div>

            <div>
              <span className="check">
                <CheckCircle2 />
              </span>

              <strong>
                Liveness Analysis
              </strong>

              <span>
                {verification?.livenessAnalysis
                  ? 'Completed'
                  : 'Not available'}
              </span>

              <ArrowUpRight />
            </div>

            <div>
              <span className="check">
                <CheckCircle2 />
              </span>

              <strong>
                Tampering Detection
              </strong>

              <span>
                {verification?.tamperingAnalysis
                  ? 'Completed'
                  : 'Not available'}
              </span>

              <ArrowUpRight />
            </div>

            <div>
              <span className="check">
                <CheckCircle2 />
              </span>

              <strong>
                Cross-Document Intelligence
              </strong>

              <span>
                {verification?.crossDocumentAnalysis
                  ? 'Completed'
                  : 'Not available'}
              </span>

              <ArrowUpRight />
            </div>

            <div>
              <span className="check">
                <CheckCircle2 />
              </span>

              <strong>
                Risk Assessment
              </strong>

              <span>
                {verification?.riskAssessment
                  ? `${risk ?? '—'} / 100`
                  : 'Pending'}
              </span>

              <ArrowUpRight />
            </div>

          </div>

        </div>

        {/* ---------------------------------------------
            Case Information
        --------------------------------------------- */}

        <div className="panel">

          <div className="panel-heading">

            <div>
              <h2>
                Case information
              </h2>

              <p>
                Information currently stored
                for this case.
              </p>
            </div>

          </div>

          <div className="info-grid">

            <div>
              <span>
                Case number
              </span>

              <strong>
                {caseData.caseNumber}
              </strong>
            </div>

            <div>
              <span>
                Document ID
              </span>

              <strong>
                {caseData.documentId ||
                  'Not available'}
              </strong>
            </div>

            <div>
              <span>
                Case status
              </span>

              <strong>
                {caseData.status}
              </strong>
            </div>

            <div>
              <span>
                Review status
              </span>

              <strong>
                {reviewStatus}
              </strong>
            </div>

            <div>
              <span>
                Created
              </span>

              <strong>
                {createdDate}
              </strong>
            </div>

            <div>
              <span>
                Last updated
              </span>

              <strong>
                {updatedDate}
              </strong>
            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          VERIFICATION RESULTS
      ================================================= */}

      {verification && (
        <VerificationResults verification={verification} />
      )}

      {/* =================================================
          OFFICER REVIEW
      ================================================= */}

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Officer review</h2>
            <p>
              Record the authorised officer's review of the
              automated screening results.
            </p>
          </div>

          <Badge className="review">
            {reviewStatus}
          </Badge>
        </div>

        <div className="info-grid">
          <div>
            <label
              htmlFor="review-status"
              style={{
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Review status
            </label>

            <select
              id="review-status"
              value={reviewStatus}
              onChange={(event) =>
                setReviewStatus(event.target.value)
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d7dee7',
                borderRadius: '6px',
                background: '#fff',
              }}
              disabled={reviewSaving}
            >
              <option value="pending">Pending</option>
              <option value="in_review">In review</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="officer-decision"
              style={{
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Officer decision
            </label>

            <select
              id="officer-decision"
              value={officerDecision}
              onChange={(event) =>
                setOfficerDecision(event.target.value)
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d7dee7',
                borderRadius: '6px',
                background: '#fff',
              }}
              disabled={reviewSaving}
            >
              <option value="">Select decision</option>
              <option value="approved">Approved</option>
              <option value="escalated">
                Escalated for further review
              </option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <label
            htmlFor="officer-remarks"
            style={{
              display: 'block',
              marginBottom: '8px',
            }}
          >
            Officer remarks
          </label>

          <textarea
            id="officer-remarks"
            value={officerRemarks}
            onChange={(event) =>
              setOfficerRemarks(event.target.value)
            }
            placeholder="Enter review observations, evidence references, or follow-up requirements."
            rows={5}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d7dee7',
              borderRadius: '6px',
              background: '#fff',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
            disabled={reviewSaving}
          />
        </div>

        <div
          className="header-actions"
          style={{ marginTop: '20px' }}
        >
          <button
            className="button primary"
            onClick={handleSaveReview}
            disabled={reviewSaving}
          >
            {reviewSaving ? (
              <>
                <Activity />
                Saving review...
              </>
            ) : (
              <>
                <ClipboardCheck />
                Save Officer Review
              </>
            )}
          </button>
        </div>

        {reviewMessage && (
          <div
            className="finding-box"
            style={{ marginTop: '16px' }}
          >
            <h3>
              <CheckCircle2 />
              Review updated
            </h3>
            <p>{reviewMessage}</p>
          </div>
        )}
      </div>

      {/* =================================================
          AUDIT TRAIL
      ================================================= */}

      <div className="panel">

        <div className="panel-heading">

          <div>
            <h2>
              Audit trail
            </h2>

            <p>
              Recorded system and officer
              activity for this case.
            </p>
          </div>

          <ScrollText />

        </div>

        {auditLogs.length === 0 ? (

          <div className="empty-panel">
            <ScrollText />

            <h2>
              No audit events
            </h2>

            <p>
              No audit events are currently
              available for this case.
            </p>
          </div>

        ) : (

          <div className="activity-list">

            {auditLogs.map(
              (log) => (
                <div
                  key={log.id}
                >
                  <span className="activity-dot" />

                  <div>
                    <strong>
                      {log.action}
                    </strong>

                    <p>
                      {log.description ||
                        'System event'}
                    </p>
                  </div>

                  <small>
                    {log.createdAt
                      ? new Date(
                          log.createdAt,
                        ).toLocaleString(
                          'en-IN',
                        )
                      : '—'}
                  </small>
                </div>
              ),
            )}

          </div>
        )}

      </div>

      {/* =================================================
          DISCLAIMER
      ================================================= */}

      <div className="finding-box">

        <h3>
          Officer review notice
        </h3>

        <p>
          Automated screening outputs are
          decision-support information only.
          Face comparison, liveness,
          tampering indicators, risk scores
          and other automated results must be
          reviewed by an authorised officer
          before any final disposition.
        </p>

      </div>
    </>
  )
}


function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [caseList, setCaseList] = useState<any[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadAuditLogs() {
      try {
        setLoading(true)
        setError('')

        const response = await getCases()
        const availableCases = response?.cases || []
        setCaseList(availableCases)

        const results = await Promise.all(
          availableCases.map(async (item: any) => {
            try {
              const auditResponse = await getAuditLogs(item.id)
              return (auditResponse?.auditLogs || []).map((log: any) => ({
                ...log,
                caseId: item.id,
                caseNumber: item.caseNumber || item.id,
              }))
            } catch {
              return []
            }
          }),
        )

        const combined = results.flat()

        combined.sort((a: any, b: any) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return bTime - aTime
        })

        setLogs(combined)
      } catch (err) {
        console.error('Failed to load audit logs:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load audit logs.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadAuditLogs()
  }, [])

  const actionOptions = useMemo(() => {
    const values = logs
      .map((log) => String(log.action || '').trim())
      .filter(Boolean)

    return Array.from(new Set(values)).sort()
  }, [logs])

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return logs.filter((log) => {
      const matchesCase =
        selectedCaseId === 'all' || log.caseId === selectedCaseId

      const matchesAction =
        actionFilter === 'all' || log.action === actionFilter

      const searchable = [
        log.action,
        log.description,
        log.caseNumber,
        log.caseId,
        log.actor,
        log.user,
        log.officerId,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (
        matchesCase &&
        matchesAction &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      )
    })
  }, [logs, selectedCaseId, actionFilter, query])

  const caseName = (caseId: string) => {
    const item = caseList.find((entry) => entry.id === caseId)
    return item?.caseNumber || caseId
  }

  const statCardStyle: CSSProperties = {
    background: '#ffffff',
    border: '1px solid #dbe3ea',
    borderRadius: '10px',
    padding: '18px 20px',
    minHeight: '108px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
  }

  const statLabelStyle: CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: '7px',
  }

  const statValueStyle: CSSProperties = {
    display: 'block',
    fontSize: '25px',
    lineHeight: 1.2,
    fontWeight: 700,
    color: '#12385b',
    marginBottom: '5px',
  }

  const statDetailStyle: CSSProperties = {
    display: 'block',
    fontSize: '12px',
    lineHeight: 1.45,
    color: '#718096',
  }

  return (
    <>
      <PageHeader
        eyebrow="Reports & Oversight"
        title="Audit Logs"
        description="Read-only record of case screening, verification, officer review, and system activity."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Total Events</span>
          <strong style={statValueStyle}>{logs.length}</strong>
          <small style={statDetailStyle}>Recorded audit events</small>
        </div>

        <div style={statCardStyle}>
          <span style={statLabelStyle}>Displayed</span>
          <strong style={statValueStyle}>{filteredLogs.length}</strong>
          <small style={statDetailStyle}>Events matching current filters</small>
        </div>

        <div style={statCardStyle}>
          <span style={statLabelStyle}>Cases</span>
          <strong style={statValueStyle}>{caseList.length}</strong>
          <small style={statDetailStyle}>Cases checked for audit activity</small>
        </div>

        <div style={statCardStyle}>
          <span style={statLabelStyle}>Verification Coverage</span>
          <strong style={{ ...statValueStyle, fontSize: '20px' }}>Face + Liveness</strong>
          <small style={statDetailStyle}>Verification events remain part of the case trail</small>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Audit activity</h2>
            <p>System-generated and officer-related events associated with screening cases.</p>
          </div>
          <ScrollText />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(260px, 1fr) 220px 220px',
            gap: '12px',
            alignItems: 'center',
            marginBottom: '18px',
          }}
        >
          <div
            style={{
              position: 'relative',
              minWidth: 0,
            }}
          >
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '13px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                pointerEvents: 'none',
              }}
            />
            <input
              aria-label="Search audit logs"
              placeholder="Search case, action or event"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                boxSizing: 'border-box',
                padding: '0 14px 0 40px',
                border: '1px solid #cbd5e1',
                borderRadius: '7px',
                background: '#ffffff',
                color: '#173b5e',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <select
            aria-label="Filter audit logs by case"
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            style={{
              width: '100%',
              height: '42px',
              boxSizing: 'border-box',
              padding: '0 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '7px',
              background: '#ffffff',
              color: '#173b5e',
              fontSize: '14px',
            }}
          >
            <option value="all">All cases</option>
            {caseList.map((item) => (
              <option key={item.id} value={item.id}>
                {item.caseNumber || item.id}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter audit logs by action"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              width: '100%',
              height: '42px',
              boxSizing: 'border-box',
              padding: '0 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '7px',
              background: '#ffffff',
              color: '#173b5e',
              fontSize: '14px',
            }}
          >
            <option value="all">All actions</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="finding-box" style={{ marginBottom: '18px' }}>
            <h3>
              <AlertTriangle />
              Audit log loading issue
            </h3>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="empty-panel">
            <ScrollText />
            <h2>Loading audit logs</h2>
            <p>Retrieving recorded activity from the screening backend.</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-panel">
            <ScrollText />
            <h2>No audit events found</h2>
            <p>No recorded events match the selected filters.</p>
          </div>
        ) : (
          <div className="table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '900px', width: '100%' }}>
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Case</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Actor</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => {
                  const actor =
                    log.actor ||
                    log.user ||
                    log.officerId ||
                    'System'

                  return (
                    <tr key={log.id || `${log.caseId}-${log.createdAt}-${index}`}>
                      <td>
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString('en-IN')
                          : '—'}
                      </td>
                      <td>
                        <Link
                          className="case-link"
                          href={`/cases/${log.caseId}`}
                        >
                          {caseName(log.caseId)}
                        </Link>
                      </td>
                      <td>
                        <strong>{log.action || 'System event'}</strong>
                      </td>
                      <td>
                        {log.description || 'Recorded screening activity'}
                      </td>
                      <td>{actor}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '14px 16px',
          border: '1px solid #ead7a2',
          background: '#fff9e8',
          borderRadius: '8px',
          color: '#6b5a24',
          fontSize: '13px',
          lineHeight: 1.6,
        }}
      >
        <strong>Audit record notice:</strong>{' '}
        Audit logs are presented as a read-only activity trail. Face verification, liveness, document screening, and risk-analysis events should be reviewed together with the underlying evidence by an authorised officer.
      </div>
    </>
  )
}
function Reports() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedCaseId = searchParams.get('caseId')

  const [caseList, setCaseList] = useState<any[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState(requestedCaseId || '')
  const [caseData, setCaseData] = useState<any>(null)
  const [verification, setVerification] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingReport, setLoadingReport] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCases() {
      try {
        setLoading(true)
        setError('')

        const response = await getCases()
        const availableCases = response?.cases || []
        setCaseList(availableCases)

        if (requestedCaseId) {
          setSelectedCaseId(requestedCaseId)
        } else if (availableCases.length > 0) {
          setSelectedCaseId(availableCases[0].id)
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load screening cases.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadCases()
  }, [requestedCaseId])

  async function loadReport(caseId: string) {
    if (!caseId) {
      setCaseData(null)
      setVerification(null)
      return
    }

    try {
      setLoadingReport(true)
      setError('')

      const [caseResponse, verificationResponse] = await Promise.all([
        getCase(caseId),
        getVerificationResult(caseId).catch(() => null),
      ])

      setCaseData(caseResponse?.case || null)
      setVerification(
        verificationResponse?.verificationResult || null,
      )
    } catch (err) {
      console.error('Failed to load report:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load the selected case report.',
      )
      setCaseData(null)
      setVerification(null)
    } finally {
      setLoadingReport(false)
    }
  }

  useEffect(() => {
    loadReport(selectedCaseId)
  }, [selectedCaseId])

  function changeCase(caseId: string) {
    setSelectedCaseId(caseId)

    const params = new URLSearchParams(searchParams.toString())

    if (caseId) {
      params.set('caseId', caseId)
    } else {
      params.delete('caseId')
    }

    router.replace(
      params.toString()
        ? `/reports?${params.toString()}`
        : '/reports',
    )
  }

  const ocr = verification?.ocrResult
  const documentValidation = verification?.documentValidation
  const mrz = verification?.mrzResult
  const face = verification?.faceVerification
  const liveness = verification?.livenessAnalysis
  const tampering = verification?.tamperingAnalysis
  const crossDocument = verification?.crossDocumentAnalysis
  const riskAssessment = verification?.riskAssessment

  const riskScore =
    riskAssessment?.score ??
    riskAssessment?.riskScore ??
    riskAssessment?.levelScore ??
    caseData?.riskScore ??
    null

  const riskLevel =
    riskAssessment?.level ??
    riskAssessment?.riskLevel ??
    caseData?.riskLevel ??
    (typeof riskScore === 'number'
      ? riskLabel(riskScore)
      : 'Not assessed')

  const riskLevelLower = String(riskLevel).toLowerCase()

  const riskBadgeClass =
    riskLevelLower.includes('high')
      ? 'danger'
      : riskLevelLower.includes('medium')
        ? 'review'
        : riskLevelLower.includes('low')
          ? 'approved'
          : 'review'

  const ocrFields =
    ocr?.fields && typeof ocr.fields === 'object'
      ? ocr.fields
      : {}

  const comparisonRows =
    crossDocument?.fieldComparisons ||
    documentValidation?.fieldComparisons ||
    []

  const mrzChecks =
    mrz?.result?.checks ||
    mrz?.checks ||
    documentValidation?.mrzChecks ||
    null

  const faceSimilarity =
    face?.similarity ??
    face?.similarityScore ??
    face?.matchScore ??
    face?.confidence ??
    null

  const livenessScore =
    liveness?.score ??
    liveness?.confidence ??
    liveness?.qualityScore ??
    null

  const tamperingStatus = tampering
    ? humanizeKey(
        String(
          tampering.status ||
            tampering.assessment ||
            'Assessment available',
        ),
      )
    : 'Not assessed'

  const tamperingReview =
    tampering?.requiresOfficerReview === true ||
    String(
      tampering?.status ||
        tampering?.assessment ||
        '',
    )
      .toLowerCase()
      .includes('review')

  const faceResult =
    face?.match !== undefined
      ? face.match
        ? 'Match indicated'
        : 'No match indicated'
      : face
        ? 'Result available'
        : 'Not assessed'

  const livenessResult =
    liveness?.isLive !== undefined
      ? liveness.isLive
        ? 'Positive indication'
        : 'Review required'
      : liveness
        ? 'Assessment available'
        : 'Not assessed'

  const screeningStatus = caseData?.status
    ? humanizeKey(String(caseData.status))
    : verification
      ? 'Completed'
      : 'Not assessed'

  const reviewStatus = caseData?.reviewStatus
    ? humanizeKey(String(caseData.reviewStatus))
    : 'Pending officer review'

  const officerDecision =
    caseData?.officerDecision
      ? humanizeKey(String(caseData.officerDecision))
      : 'Not recorded'

  const formatDate = (value: any) => {
    if (!value) return 'Not available'

    try {
      return new Date(value).toLocaleDateString(
        'en-IN',
        {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        },
      )
    } catch {
      return String(value)
    }
  }

  const reportPdfUrl = selectedCaseId
    ? getReportPdfUrl(selectedCaseId)
    : '#'

  const printReport = () => {
    window.print()
  }

  return (
    <>
      <PageHeader
        title="Investigation Reports"
        description="Case screening reports generated from the Satyadristi verification pipeline."
        action={
          <div className="header-actions">
            <button
              className="button secondary"
              onClick={printReport}
              disabled={!caseData}
            >
              <Printer />
              Print report
            </button>

            <a
              className="button primary"
              href={reportPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!selectedCaseId}
              onClick={(event) => {
                if (!selectedCaseId) {
                  event.preventDefault()
                }
              }}
            >
              <Download />
              View PDF
            </a>
          </div>
        }
      />

      <div
        className="panel"
        style={{ marginBottom: '20px' }}
      >
        <div
          className="panel-heading"
          style={{ alignItems: 'center' }}
        >
          <div>
            <div className="eyebrow">
              Report selection
            </div>
            <h2 style={{ marginBottom: '4px' }}>
              Select screening case
            </h2>
            <p>
              Reports are populated from the selected backend case
              and its available verification results.
            </p>
          </div>

          <select
            aria-label="Select case report"
            value={selectedCaseId}
            onChange={(event) =>
              changeCase(event.target.value)
            }
            disabled={loading}
            style={{
              minWidth: '280px',
              padding: '10px 12px',
              border: '1px solid #d8e0e8',
              borderRadius: '7px',
              background: '#fff',
              color: '#25364a',
            }}
          >
            <option value="">
              {loading
                ? 'Loading cases...'
                : 'Select a case'}
            </option>

            {caseList.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.caseNumber || item.id}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div
            style={{
              marginTop: '14px',
              padding: '12px 14px',
              border: '1px solid #ead7a2',
              background: '#fff9e8',
              borderRadius: '7px',
              color: '#6b5a24',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {loadingReport ? (
        <div className="panel">
          <div className="empty-panel">
            <Activity />
            <h2>Loading report...</h2>
            <p>
              Retrieving case information and screening results
              from the Satyadristi backend.
            </p>
          </div>
        </div>
      ) : !caseData ? (
        <div className="panel">
          <div className="empty-panel">
            <FileText />
            <h2>No case selected</h2>
            <p>
              Select a screening case above to view its
              investigation report.
            </p>
          </div>
        </div>
      ) : (
        <article className="report investigation-report">
          <section className="risk-banner">
            <div className="risk-score">
              <h3>
                <Gauge />
                Overall risk assessment
              </h3>

              <div className="score-ring">
                <strong>
                  {riskScore ?? '—'}
                </strong>
                <span>/ 100</span>
              </div>

              <Badge className={riskBadgeClass}>
                {humanizeKey(String(riskLevel))}
              </Badge>

              <p>
                Risk information is an automated screening
                indicator and requires authorised officer review.
              </p>
            </div>

            <div className="risk-factors">
              <h3>Screening summary</h3>

              <div>
                <span>
                  <CheckCircle2 />
                  OCR & data extraction
                </span>
                <b>{ocr ? 'Available' : 'Pending'}</b>
              </div>

              <div>
                <span>
                  <CheckCircle2 />
                  Document validation
                </span>
                <b>
                  {documentValidation
                    ? 'Available'
                    : 'Pending'}
                </b>
              </div>

              <div>
                <span>
                  <CheckCircle2 />
                  MRZ verification
                </span>
                <b>
                  {mrz ? 'Available' : 'Pending'}
                </b>
              </div>

              <div>
                <span>
                  <AlertTriangle />
                  Tampering assessment
                </span>
                <b>
                  {tampering
                    ? tamperingStatus
                    : 'Pending'}
                </b>
              </div>
            </div>

            <div className="recommendation">
              <h3>Officer review</h3>

              <div className="recommendation-box">
                <ClipboardCheck />

                <div>
                  <strong>
                    {officerDecision ===
                    'Not recorded'
                      ? 'Decision pending'
                      : officerDecision}
                  </strong>

                  <p>
                    Review the screening evidence before
                    recording the final case disposition.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="report-stat-grid">
            <div>
              <FolderOpen />
              <span>Case status</span>
              <strong>{screeningStatus}</strong>
            </div>

            <div>
              <FileText />
              <span>Case number</span>
              <strong>
                {caseData.caseNumber ||
                  selectedCaseId}
              </strong>
            </div>

            <div>
              <ShieldCheck />
              <span>Review status</span>
              <strong>{reviewStatus}</strong>
            </div>

            <div>
              <Clock3 />
              <span>Created date</span>
              <strong>
                {formatDate(
                  caseData.createdAt,
                )}
              </strong>
            </div>
          </div>

          <div className="report-head">
            <div>
              <span>
                Satyadristi National Immigration Document
                Screening Portal
              </span>

              <h2>Investigation Report</h2>

              <p>
                Generated {formatDate(new Date())} ·
                Classification: Controlled
              </p>
            </div>

            <div className="report-stamp">
              INTERNAL
              <br />
              REVIEW COPY
            </div>
          </div>

          <ReportSection
            title="Case information"
            rows={[
              [
                'Case number',
                caseData.caseNumber ||
                  selectedCaseId,
              ],
              [
                'Document ID',
                caseData.documentId ||
                  'Not available',
              ],
              [
                'Case status',
                screeningStatus,
              ],
              [
                'Review status',
                reviewStatus,
              ],
              [
                'Officer decision',
                officerDecision,
              ],
              [
                'Risk level',
                humanizeKey(
                  String(riskLevel),
                ),
              ],
            ]}
          />

          <ReportSection
            title="Document screening"
            rows={[
              [
                'OCR & data extraction',
                ocr
                  ? `${Object.keys(ocrFields).length} field(s) extracted`
                  : 'Not available',
              ],
              [
                'Document validation',
                documentValidation
                  ? 'Result available'
                  : 'Not available',
              ],
              [
                'MRZ verification',
                mrz
                  ? 'Result available'
                  : 'Not available',
              ],
              [
                'Face verification',
                faceResult,
              ],
              [
                'Liveness analysis',
                livenessResult,
              ],
              [
                'Tampering analysis',
                tampering
                  ? tamperingStatus
                  : 'Not available',
              ],
            ]}
          />

          <div className="report-columns">
            <ReportSection
              title="OCR & identity fields"
              rows={
                Object.entries(ocrFields)
                  .slice(0, 8)
                  .map(
                    ([key, value]) => [
                      humanizeKey(key),
                      displayValue(
                        value,
                        key,
                      ),
                    ],
                  )
              }
            />

            <ReportSection
              title="MRZ validation"
              rows={
                mrzChecks &&
                typeof mrzChecks === 'object'
                  ? Object.entries(mrzChecks)
                      .slice(0, 8)
                      .map(
                        ([key, value]) => [
                          humanizeKey(key),
                          displayValue(
                            value,
                            key,
                          ),
                        ],
                      )
                  : [
                      [
                        'MRZ result',
                        mrz
                          ? 'Available'
                          : 'Not available',
                      ],
                    ]
              }
            />
          </div>

          <section className="report-section">
            <h3>Verification findings</h3>

            <div className="detail-table">
              <div className="detail-row">
                <span>Face verification</span>
                <strong>
                  {faceResult}
                  {faceSimilarity !== null
                    ? ` · ${faceSimilarity}%`
                    : ''}
                </strong>
                <Badge className="review">
                  Officer review
                </Badge>
              </div>

              <div className="detail-row">
                <span>Liveness analysis</span>
                <strong>
                  {livenessResult}
                  {livenessScore !== null
                    ? ` · ${livenessScore}`
                    : ''}
                </strong>
                <Badge className="review">
                  Officer review
                </Badge>
              </div>

              <div className="detail-row">
                <span>Tampering analysis</span>
                <strong>
                  {tampering
                    ? tamperingStatus
                    : 'Not available'}
                </strong>
                <Badge
                  className={
                    tamperingReview
                      ? 'review'
                      : 'approved'
                  }
                >
                  {tamperingReview
                    ? 'Review'
                    : 'Available'}
                </Badge>
              </div>

              <div className="detail-row">
                <span>
                  Cross-document consistency
                </span>
                <strong>
                  {comparisonRows.length > 0
                    ? `${comparisonRows.length} field comparison(s)`
                    : crossDocument
                      ? 'Result available'
                      : 'Not available'}
                </strong>
                <Badge
                  className={
                    crossDocument
                      ? 'approved'
                      : 'review'
                  }
                >
                  {crossDocument
                    ? 'Available'
                    : 'Pending'}
                </Badge>
              </div>
            </div>

            {comparisonRows.length > 0 && (
              <div
                style={{
                  marginTop: '18px',
                  overflowX: 'auto',
                }}
              >
                <ComparisonTable
                  rows={comparisonRows}
                />
              </div>
            )}
          </section>

          <section className="report-section">
            <h3>Risk assessment</h3>

            <div className="detail-table">
              <div className="detail-row">
                <span>Risk score</span>
                <strong>
                  {riskScore ?? 'Not assessed'} / 100
                </strong>
                <Badge className={riskBadgeClass}>
                  {humanizeKey(
                    String(riskLevel),
                  )}
                </Badge>
              </div>

              <div className="detail-row">
                <span>Officer review</span>
                <strong>
                  Required before final disposition
                </strong>
                <Badge className="review">
                  Required
                </Badge>
              </div>
            </div>

            {Array.isArray(
              riskAssessment?.factors,
            ) &&
              riskAssessment.factors.length > 0 && (
                <div
                  style={{
                    marginTop: '18px',
                  }}
                >
                  <h4>
                    Risk factors
                  </h4>

                  <div className="detail-table">
                    {riskAssessment.factors.map(
                      (factor: any, index: number) => {
                        const name =
                          typeof factor ===
                          'string'
                            ? factor
                            : factor?.factor ||
                              factor?.name ||
                              factor?.reason ||
                              factor?.description ||
                              `Risk factor ${index + 1}`

                        const impact =
                          typeof factor ===
                            'object' &&
                          factor
                            ? factor.score ??
                              factor.points ??
                              factor.impact ??
                              factor.weight
                            : null

                        return (
                          <div
                            className="detail-row"
                            key={`${name}-${index}`}
                          >
                            <span>
                              {humanizeKey(
                                String(name),
                              )}
                            </span>
                            <strong>
                              {impact !==
                                null &&
                              impact !==
                                undefined
                                ? String(
                                    impact,
                                  )
                                : 'Review indicator'}
                            </strong>
                            <Badge className="review">
                              Review
                            </Badge>
                          </div>
                        )
                      },
                    )}
                  </div>
                </div>
              )}
          </section>

          <section className="report-section">
            <h3>
              Officer notes and decision
            </h3>

            <p className="report-note">
              Automated screening results are
              decision-support information. Final
              case disposition must be recorded by
              an authorised officer after reviewing
              the available evidence.
            </p>

            <div className="decision-box">
              <span>Current decision</span>
              <strong>
                {officerDecision}
              </strong>
            </div>
          </section>

          <footer className="report-footer">
            This is a fictional demonstration
            document. It is not an official government
            record.
          </footer>
        </article>
      )}
    </>
  )
}
function ReportSection({ title, rows }: { title: string; rows: string[][] }) { return <section className="report-section"><h3>{title}</h3>{rows.map(r => <div className="report-row" key={r[0]}><span>{r[0]}</span><strong>{r[1]}</strong></div>)}</section> }
function SimplePage({ title, description, icon: Icon = Gauge }: { title: string; description: string; icon?: any }) { return <><PageHeader title={title} description={description} /><div className="empty-panel"><Icon /><h2>{title}</h2><p>This module is ready for authorised officer use. Connect approved services in a future release; the current prototype uses fictional static data only.</p><button className="button primary" onClick={() => window.history.back()}>Return to previous page</button></div></> }
function UploadPage() {
  const router = useRouter()

  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [createdCase, setCreatedCase] = useState<{
  id: string
  caseNumber: string
} | null>(null)

  function handleFile(selectedFile: File | null) {
    setError('')
    setSuccess('')

    if (!selectedFile) return

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      setError(
        'Unsupported file type. Please upload a JPG, PNG or PDF file.',
      )
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError(
        'File size must be 10 MB or smaller.',
      )
      return
    }

    setFile(selectedFile)
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault()
    setDragActive(false)

    const droppedFile =
      event.dataTransfer.files?.[0] || null

    handleFile(droppedFile)
  }

  async function handleUpload() {
    if (!file) {
      setError('Please select a document first.')
      return
    }

    try {
      setUploading(true)
      setError('')
      setSuccess('')

      // ------------------------------------------
      // 1. Upload document
      // ------------------------------------------

      const uploadResult =
        await uploadDocument(file)

      // ------------------------------------------
      // 2. Create screening case
      // ------------------------------------------

      const caseResult =
  await createCase(
    uploadResult.documentId,
  )

await addDocumentToCase(
  caseResult.case.id,
  uploadResult.documentId,
  'passport',
  uploadResult.filename,
  uploadResult.filePath,
)

setCreatedCase(caseResult.case)

setSuccess(
  `Document uploaded successfully. Case ${caseResult.case.caseNumber} created.`,
)
    } catch (err) {
      console.error(
        'Failed to create screening case:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create screening case.',
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Case management"
        title="New Document Screening"
        description="Create a screening case and upload applicant documentation."
      />

      <div className="upload-page">

        {/* -----------------------------------------
            Upload panel
        ----------------------------------------- */}

        <div className="panel">

          <div className="panel-heading">
            <div>
              <h2>Upload document</h2>

              <p>
                Upload a passport, visa, identity
                document or supporting evidence.
              </p>
            </div>

            <Upload />
          </div>

          <div
            className={`upload-dropzone ${
              dragActive ? 'drag-active' : ''
            }`}
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => {
              setDragActive(false)
            }}
            onDrop={handleDrop}
          >

            <div className="upload-icon">
              <Upload />
            </div>

            <h3>
              {file
                ? file.name
                : 'Drop your document here'}
            </h3>

            <p>
              {file
                ? `${(
                    file.size /
                    1024 /
                    1024
                  ).toFixed(2)} MB`
                : 'or select a file from your computer'}
            </p>

            <label className="button secondary">
              <Upload />
              Select document

              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                hidden
                onChange={(event) =>
                  handleFile(
                    event.target.files?.[0] ||
                      null,
                  )
                }
              />
            </label>

            <small>
              Accepted: JPG, PNG, PDF · Maximum
              10 MB
            </small>

          </div>

          {/* ---------------------------------------
              Selected file
          --------------------------------------- */}

          {file && (
            <div className="selected-file">

              <FileText />

              <div>
                <strong>
                  {file.name}
                </strong>

                <span>
                  {file.type || 'Document'} ·{' '}
                  {(
                    file.size /
                    1024 /
                    1024
                  ).toFixed(2)} MB
                </span>
              </div>

              <button
                className="button secondary"
                onClick={() => {
                  setFile(null)
                  setCreatedCase(null)
                  setSuccess('')
                  setError('')
                }}
              >
                Remove
              </button>

            </div>
          )}

          {/* ---------------------------------------
              Error
          --------------------------------------- */}

          {error && (
            <div className="finding-box">
              <h3>
                <AlertTriangle />
                Upload error
              </h3>

              <p>{error}</p>
            </div>
          )}

          {/* ---------------------------------------
              Success
          --------------------------------------- */}

          {success && (
            <div className="finding-box">
              <h3>
                <CheckCircle2 />
                Screening case created
              </h3>

              <p>{success}</p>
            </div>
          )}

          {/* ---------------------------------------
              Actions
          --------------------------------------- */}

          <div className="header-actions">

            <button
              className="button secondary"
              onClick={() =>
                router.push('/cases')
              }
              disabled={uploading}
            >
              Cancel
            </button>

            {!createdCase ? (
              <button
                className="button primary"
                onClick={handleUpload}
                disabled={
                  !file || uploading
                }
              >
                {uploading ? (
                  <>
                    <Activity />
                    Creating case...
                  </>
                ) : (
                  <>
                    <Upload />
                    Upload & Create Case
                  </>
                )}
              </button>
            ) : (
              <button
                className="button primary"
                onClick={() =>
                  router.push(
                    `/cases/${createdCase.id}`,
                  )
                }
              >
                <Eye />
                Open Case
              </button>
            )}

          </div>

        </div>

        {/* -----------------------------------------
            Workflow information
        ----------------------------------------- */}

        <div className="panel">

          <div className="panel-heading">
            <div>
              <h2>Screening workflow</h2>

              <p>
                Documents are processed through the
                Satyadristi screening pipeline.
              </p>
            </div>

            <ShieldCheck />
          </div>

          <div className="summary-list">

            <div>
              <span className="check">
                <CheckCircle2 />
              </span>

              <strong>
                Document upload
              </strong>

              <span>Step 1</span>
            </div>

            <div>
              <span className="check">
                <CheckCircle2 />
              </span>

              <strong>
                OCR & field extraction
              </strong>

              <span>Automated</span>
            </div>

            <div>
              <span className="check">
                <CheckCircle2 />
              </span>

              <strong>
                MRZ & document validation
              </strong>

              <span>Automated</span>
            </div>

            <div>
              <span className="check">
                <CheckCircle2 />
              </span>

              <strong>
                Biometric & integrity analysis
              </strong>

              <span>Automated</span>
            </div>

            <div>
              <span className="check">
                <CheckCircle2 />
              </span>

              <strong>
                Risk assessment
              </strong>

              <span>Decision support</span>
            </div>

            <div>
              <span className="check">
                <CheckCircle2 />
              </span>

              <strong>
                Authorised officer review
              </strong>

              <span>Required</span>
            </div>

          </div>

          <div className="finding-box">
            <h3>Important</h3>

            <p>
              Automated screening results are
              decision-support information only.
              Final case disposition requires
              authorised officer review.
            </p>
          </div>

        </div>

      </div>
    </>
  )
}
function SplashScreen() { const router = useRouter(); useEffect(() => { const timer = window.setTimeout(() => router.replace('/sign-in'), 1800); return () => window.clearTimeout(timer) }, [router]); return <main className="splash-screen" aria-label="Loading Satyadristi portal"><div className="splash-glow" /><div className="splash-card"><img src={logo} alt="Satyadristi National Immigration Document Screening Portal" /><div className="splash-kicker">Government of India</div><h1>Satyadristi</h1><p>National Immigration Document Screening Portal</p><div className="splash-loader" aria-hidden="true"><span /></div><small>Secure officer workspace</small></div></main> }

export default function Page() { const pathname = usePathname(); const router = useRouter(); const [mobileOpen, setMobileOpen] = useState(false); if (pathname === '/') return <SplashScreen />; const content = pathname.startsWith('/cases/') ? <CaseDetails id={decodeURIComponent(pathname.split('/').pop() || '')} /> : pathname === '/cases' ? <CasesPage /> : pathname === '/verification' ? <Verification /> : pathname === '/reports' ? <Reports /> : pathname === '/dashboard' || pathname === '/' ? <Dashboard /> : pathname === '/upload'
  ? <UploadPage/> : pathname === '/analytics' ? <SimplePage title="Analytics & Reports" description="Administrative screening trends and risk distribution." icon={Activity} /> : pathname === '/alerts' ? <SimplePage title="Alerts & Notifications" description="Priority alerts, case updates and document notifications." icon={Bell} /> : pathname === '/audit-logs' ? <AuditLogs /> : pathname === '/profile' ? <SimplePage title="Officer Profile" description="IMM-2026-001 · Demo Officer · Immigration Officer" icon={UserRound} /> : pathname === '/settings' ? <SimplePage title="System Settings" description="Account, notification and security preferences." icon={Settings} /> : <Dashboard />; return <div className="portal"><Header onMenu={() => setMobileOpen(true)} /><Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} /><main className="main"><div className="content">{content}</div><footer className="site-footer"><span>© 2026 Satyadristi National Immigration Document Screening Portal</span><span>Prototype / Demonstration System · Authorised access only</span></footer></main></div> }
