import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight, BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const changeMode = (next) => {
    setMode(next);
    setError('');
    setNotice('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      if (mode === 'signup') {
        await register({ full_name: name, email, password, role: 'student' });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Unable to continue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200">
        <section className="hidden lg:flex flex-col justify-between p-12 text-white bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15"><GraduationCap className="w-7 h-7" /></div>
            <span className="text-xl font-bold">B.Tech Student ERP</span>
          </div>
          <div>
            <p className="text-indigo-100 text-sm font-semibold uppercase tracking-[0.2em]">Your campus, connected</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight">Make every part of your academic journey easier.</h1>
            <p className="mt-5 text-indigo-100 leading-relaxed">Access student records, attendance, fees, courses, and exam results from one secure place.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-indigo-100"><ShieldCheck className="w-4 h-4" /> Secure access for your campus community</div>
        </section>

        <section className="p-7 sm:p-10 lg:p-12">
          <div className="lg:hidden flex items-center gap-2 text-indigo-700 mb-8"><GraduationCap className="w-7 h-7" /><span className="font-bold">B.Tech Student ERP</span></div>
          <div className="flex gap-6 border-b border-slate-200 mb-8">
            <button onClick={() => changeMode('login')} className={`pb-3 text-sm font-semibold border-b-2 ${mode === 'login' || mode === 'forgot' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>Sign in</button>
            <button onClick={() => changeMode('signup')} className={`pb-3 text-sm font-semibold border-b-2 ${mode === 'signup' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>Create account</button>
          </div>

          {mode === 'forgot' ? (
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5"><ShieldCheck className="w-6 h-6" /></div>
              <h2 className="text-2xl font-bold text-slate-900">Reset your password</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">Password recovery by email is not configured for this ERP yet. Please contact your campus administrator to reset your account password.</p>
              <button onClick={() => changeMode('login')} className="mt-6 text-sm font-semibold text-indigo-700 hover:text-indigo-900">Back to sign in</button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900">{mode === 'signup' ? 'Create your student account' : 'Welcome back'}</h2>
              <p className="mt-2 text-sm text-slate-500">{mode === 'signup' ? 'Register to access your academic information.' : 'Sign in to continue to your student ERP.'}</p>
              {error && <div role="alert" className="mt-5 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex gap-2"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
              {notice && <div role="status" className="mt-5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm">{notice}</div>}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {mode === 'signup' && <div><label htmlFor="full-name" className="block text-sm font-medium text-slate-700">Full name</label><input id="full-name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Your full name" /></div>}
                <div><label htmlFor="email" className="block text-sm font-medium text-slate-700">Email or username</label><input id="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="you@college.edu" /></div>
                <div><label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label><input id="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 6 : undefined} required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'} /></div>
                {mode === 'login' && <div className="text-right"><button type="button" onClick={() => changeMode('forgot')} className="text-sm font-medium text-indigo-700 hover:text-indigo-900">Forgot password?</button></div>}
                <button disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60">{loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}{!loading && <ArrowRight className="w-4 h-4" />}</button>
              </form>
              <div className="mt-7 flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4"><BookOpen className="w-5 h-5 text-slate-500 shrink-0" /><p className="text-xs leading-relaxed text-slate-600">Student self-registration creates a student account. Faculty and administrator accounts are managed by your campus.</p></div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
