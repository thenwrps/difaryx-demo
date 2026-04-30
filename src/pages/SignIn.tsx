import React, { FormEvent, useState } from 'react';
import { ArrowLeft, ArrowRight, Mail, UserRound } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [emailMode, setEmailMode] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  // Get the page they were trying to access, or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const enterDemo = (profile = { name: 'Demo Researcher', email: 'demo@difaryx.local', organization: 'DIFARYX Demo Lab' }) => {
    signIn(profile);
    navigate(from, { replace: true });
  };

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setEmailError('Enter an email and password to continue in demo mode.');
      return;
    }
    enterDemo({
      name: email.split('@')[0] || 'Demo Researcher',
      email: email.trim(),
      organization: 'DIFARYX Demo Lab',
    });
  };

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setEmailError('Enter a name, email, and password to create a demo account.');
      return;
    }
    enterDemo({
      name: name.trim(),
      email: email.trim(),
      organization: organization.trim() || 'DIFARYX Demo Lab',
    });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <Link to="/" className="inline-flex w-fit items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm hover:border-blue-200">
          <img src="/logo/difaryx.png" alt="DIFARYX" className="h-10 object-contain" />
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="mb-7 text-center">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">DIFARYX</p>
              <span className="mb-3 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">
                Demo authentication
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">Enter DIFARYX</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Access scientific workflows, notebooks, and autonomous agent reasoning.
              </p>
            </div>

            <Card className="border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
              <CardContent className="p-6">
                {!emailMode && !createMode ? (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="h-12 w-full justify-center gap-3 border-slate-200 bg-white text-base font-semibold text-slate-800 hover:border-blue-300 hover:bg-blue-50/60"
                      onClick={() => {
                        enterDemo({ name: 'Demo Researcher', email: 'demo@difaryx.local', organization: 'DIFARYX Demo Lab' });
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                        <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                        <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                        <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                        <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26537 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                      </svg>
                      Continue with Google (Demo)
                    </Button>

                    <Button
                      variant="outline"
                      className="h-12 w-full justify-between border-slate-200 bg-white px-4 text-base font-semibold text-slate-800 hover:border-blue-300 hover:bg-blue-50/60"
                      onClick={() => {
                        setEmailMode(true);
                        setCreateMode(false);
                        setEmailError('');
                      }}
                    >
                      <span className="flex items-center gap-3">
                        <Mail size={18} />
                        Continue with Email
                      </span>
                      <ArrowRight size={18} className="text-slate-400" />
                    </Button>

                    <Button
                      variant="outline"
                      className="h-12 w-full justify-between border-slate-200 bg-white px-4 text-base font-semibold text-slate-800 hover:border-blue-300 hover:bg-blue-50/60"
                      onClick={() => {
                        setCreateMode(true);
                        setEmailMode(false);
                        setEmailError('');
                      }}
                    >
                      <span className="flex items-center gap-3">
                        <UserRound size={18} />
                        Create demo account
                      </span>
                      <ArrowRight size={18} className="text-slate-400" />
                    </Button>

                    <Button
                      className="h-12 w-full justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-base font-bold text-white shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-indigo-600/25"
                      onClick={() => enterDemo()}
                    >
                      <span className="flex items-center gap-3">
                        <UserRound size={18} />
                        Continue as Guest / Demo Researcher
                      </span>
                      <ArrowRight size={18} />
                    </Button>
                  </div>
                ) : (
                  createMode ? (
                  <form className="space-y-4" onSubmit={handleCreateSubmit}>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateMode(false);
                        setEmailError('');
                      }}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600"
                    >
                      <ArrowLeft size={14} />
                      Back to login options
                    </button>
                    <label className="block text-sm font-semibold text-slate-700">
                      Name
                      <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Demo Researcher"
                        className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      Email
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="researcher@example.com"
                        className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      Password
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Create demo password"
                        className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      Organization
                      <input
                        type="text"
                        value={organization}
                        onChange={(event) => setOrganization(event.target.value)}
                        placeholder="Optional"
                        className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    {emailError && <p className="text-xs font-medium text-amber-600">{emailError}</p>}
                    <Button
                      type="submit"
                      className="h-12 w-full justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-base font-bold text-white shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-indigo-600/25"
                    >
                      Create account and enter
                      <ArrowRight size={18} />
                    </Button>
                  </form>
                  ) : (
                  <form className="space-y-4" onSubmit={handleEmailSubmit}>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailMode(false);
                        setEmailError('');
                      }}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600"
                    >
                      <ArrowLeft size={14} />
                      Back to login options
                    </button>
                    <label className="block text-sm font-semibold text-slate-700">
                      Email
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="researcher@example.com"
                        className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      Password
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Demo password"
                        className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    {emailError && <p className="text-xs font-medium text-amber-600">{emailError}</p>}
                    <Button
                      type="submit"
                      className="h-12 w-full justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-base font-bold text-white shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-indigo-600/25"
                    >
                      Continue / Sign in
                      <ArrowRight size={18} />
                    </Button>
                  </form>
                  )
                )}

                <p className="pt-2 text-center text-xs text-slate-500">Demo mode uses bundled scientific datasets.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
