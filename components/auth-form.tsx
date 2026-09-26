'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const signUp = mode === 'sign-up'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const result = signUp
      ? await authClient.signUp.email({ name, email, password })
      : await authClient.signIn.email({ email, password })
    setLoading(false)
    if (result.error) {
      setError('Unable to complete authentication. Check your details and try again.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand"><img className="auth-logo" src="PHOTO-2026-09-23-21-32-45.jpg" alt="Satyadristi portal logo" /><div><strong>SATYADRISHTI</strong><span>National Immigration Document Screening Portal</span></div></div>
        <div className="auth-heading"><span className="auth-eyebrow">Secure access</span><h1>{signUp ? 'Create your officer account' : 'Welcome back'}</h1><p>{signUp ? 'Register to access Satyadristi screening workflows.' : 'Sign in to continue to the Satyadristi portal.'}</p></div>
        <form onSubmit={submit} className="auth-form">
          {signUp && <label>Full name<input value={name} onChange={e => setName(e.target.value)} required autoComplete="name" /></label>}
          <label>Official email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete={signUp ? 'new-password' : 'current-password'} /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={loading}>{loading ? 'Authenticating…' : signUp ? 'Create account' : 'Sign in securely'}</button>
        </form>
        <p className="auth-switch">{signUp ? 'Already registered?' : 'Need an officer account?'} <Link href={signUp ? '/sign-in' : '/sign-up'}>{signUp ? 'Sign in' : 'Register here'}</Link></p>
        <p className="auth-note">Access is limited to authorised immigration screening personnel.</p>
      </section>
    </main>
  )
}
