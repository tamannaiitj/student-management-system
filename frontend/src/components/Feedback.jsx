import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquareText, Plus, Send, Star, X } from 'lucide-react';

const emptyQuestion = () => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, prompt: '', type: 'rating' });

export function Feedback() {
  const { isAdmin, isFaculty } = useAuth();
  const canManage = isAdmin || isFaculty;
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState(null);
  const [activeForm, setActiveForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [title, setTitle] = useState('');
  const [professor, setProfessor] = useState('');
  const [course, setCourse] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [publishNow, setPublishNow] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadForms = async () => {
    try { setForms(await api.getFeedbackForms()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadForms(); }, []);

  const createForm = async (event) => {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      await api.createFeedbackForm({ title, professor_name: professor, course, description, questions, status: publishNow ? 'open' : 'draft' });
      setTitle(''); setProfessor(''); setCourse(''); setDescription(''); setQuestions([emptyQuestion()]);
      setMessage(publishNow ? 'Feedback form published for students.' : 'Draft saved. You can publish it when ready.');
      await loadForms();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const changeStatus = async (form, status) => {
    setError('');
    try { await api.setFeedbackFormStatus(form.id, status); await loadForms(); }
    catch (err) { setError(err.message); }
  };

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await api.submitFeedback(activeForm.id, answers);
      setActiveForm(null); setAnswers({}); setMessage('Your feedback has been submitted. Thank you.'); await loadForms();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const openResponses = async (form) => {
    setError(''); setResponses({ form, items: null });
    try { setResponses({ form, items: await api.getFeedbackResponses(form.id) }); }
    catch (err) { setError(err.message); setResponses(null); }
  };

  const addQuestion = () => setQuestions((current) => [...current, emptyQuestion()]);
  const updateQuestion = (id, update) => setQuestions((current) => current.map((question) => question.id === id ? { ...question, ...update } : question));

  return <div className="space-y-6">
    <header className="flex items-start gap-3"><div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600"><MessageSquareText className="w-6 h-6" /></div><div><h2 className="text-2xl font-bold text-slate-900">Professor Feedback</h2><p className="mt-1 text-sm text-slate-500">{canManage ? 'Create and publish student feedback forms, then review responses.' : 'Share feedback on your professors while a form is open.'}</p></div></header>
    {error && <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800">{error}</div>}
    {message && <div role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">{message}</div>}

    {canManage && <form onSubmit={createForm} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
      <div><h3 className="font-bold text-slate-900">Create a feedback form</h3><p className="text-xs text-slate-500 mt-1">Publish it now to make it available to students, or save it as a draft.</p></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="text-sm font-medium text-slate-700">Form title<input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course feedback - Semester 1" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">Professor name<input required maxLength={120} value={professor} onChange={(e) => setProfessor(e.target.value)} placeholder="Professor name" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">Course or subject <span className="font-normal text-slate-400">(optional)</span><input maxLength={120} value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. Data Structures" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">Instructions <span className="font-normal text-slate-400">(optional)</span><input maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Please answer honestly and respectfully." className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
      </div>
      <div className="space-y-3"><div className="flex justify-between items-center"><h4 className="text-sm font-semibold text-slate-800">Questions</h4><button type="button" onClick={addQuestion} disabled={questions.length >= 20} className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 disabled:opacity-50"><Plus className="w-4 h-4" /> Add question</button></div>
        {questions.map((question, index) => <div key={question.id} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"><span className="text-xs font-semibold text-slate-400 sm:w-6">{index + 1}.</span><input required maxLength={300} value={question.prompt} onChange={(e) => updateQuestion(question.id, { prompt: e.target.value })} placeholder="Write your question" className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /><select value={question.type} onChange={(e) => updateQuestion(question.id, { type: e.target.value })} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"><option value="rating">Rating (1-5)</option><option value="text">Written answer</option></select><button type="button" aria-label="Remove question" disabled={questions.length === 1} onClick={() => setQuestions((current) => current.filter((item) => item.id !== question.id))} className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30"><X className="w-4 h-4" /></button></div>)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2"><label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} className="rounded border-slate-300 text-indigo-600" /> Publish immediately</label><button disabled={busy} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{busy ? 'Saving...' : publishNow ? 'Publish form' : 'Save draft'}</button></div>
    </form>}

    <section className="space-y-3"><h3 className="font-bold text-slate-900">{canManage ? 'Feedback forms' : 'Open forms'}</h3>{loading ? <p className="text-sm text-slate-500">Loading forms...</p> : forms.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{canManage ? 'No feedback forms yet.' : 'There are no open feedback forms right now.'}</div> : forms.map((form) => <article key={form.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h4 className="font-bold text-slate-900">{form.title}</h4><span className={`text-[11px] font-bold uppercase px-2 py-1 rounded-full ${form.status === 'open' ? 'bg-emerald-50 text-emerald-700' : form.status === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{form.status}</span>{form.has_submitted && <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">Submitted</span>}</div><p className="text-sm text-slate-600 mt-1">{form.professor_name}{form.course ? ` · ${form.course}` : ''}</p>{form.description && <p className="text-xs text-slate-500 mt-1">{form.description}</p>}</div><div className="flex flex-wrap gap-2">{canManage ? <><button onClick={() => openResponses(form)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Responses</button>{form.status !== 'open' && <button onClick={() => changeStatus(form, 'open')} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Publish</button>}{form.status === 'open' && <button onClick={() => changeStatus(form, 'closed')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>}</> : form.has_submitted ? <span className="text-sm font-medium text-emerald-700">Response received</span> : <button onClick={() => { setAnswers({}); setActiveForm(form); }} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Give feedback <Send className="w-4 h-4" /></button>}</div></article>)}</section>

    {activeForm && <div className="fixed inset-0 z-50 bg-slate-950/50 p-4 flex items-center justify-center"><form onSubmit={submit} className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5"><div className="flex justify-between gap-4"><div><h3 className="text-xl font-bold text-slate-900">{activeForm.title}</h3><p className="text-sm text-slate-500 mt-1">{activeForm.professor_name}{activeForm.course ? ` · ${activeForm.course}` : ''}</p>{activeForm.description && <p className="text-sm text-slate-600 mt-3">{activeForm.description}</p>}</div><button type="button" onClick={() => setActiveForm(null)} aria-label="Close form" className="self-start p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button></div>{activeForm.questions.map((question, index) => <div key={question.id}><label className="block text-sm font-semibold text-slate-800">{index + 1}. {question.prompt}</label>{question.type === 'rating' ? <div className="flex gap-2 mt-2">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" aria-label={`${rating} out of 5`} onClick={() => setAnswers((current) => ({ ...current, [question.id]: rating }))} className={`p-2 rounded-lg border ${answers[question.id] === rating ? 'bg-amber-50 border-amber-400 text-amber-600' : 'border-slate-200 text-slate-400'}`}><Star className="w-5 h-5" fill={answers[question.id] >= rating ? 'currentColor' : 'none'} /></button>)}</div> : <textarea required maxLength={2000} value={answers[question.id] || ''} onChange={(e) => setAnswers((current) => ({ ...current, [question.id]: e.target.value }))} rows={3} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" placeholder="Write your feedback" />}</div>)}<button disabled={busy} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{busy ? 'Submitting...' : 'Submit feedback'}</button></form></div>}

    {responses && <div className="fixed inset-0 z-50 bg-slate-950/50 p-4 flex items-center justify-center"><div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6"><div className="flex justify-between items-start gap-4"><div><h3 className="text-xl font-bold text-slate-900">Responses: {responses.form.title}</h3><p className="text-sm text-slate-500 mt-1">{responses.items?.length ?? '...'} student submissions</p></div><button onClick={() => setResponses(null)} aria-label="Close responses" className="p-1 text-slate-400"><X className="w-5 h-5" /></button></div>{responses.items === null ? <p className="py-8 text-center text-slate-500">Loading responses...</p> : responses.items.length === 0 ? <p className="py-8 text-center text-slate-500">No responses received yet.</p> : <div className="mt-5 space-y-4">{responses.items.map((response) => <article key={response.id} className="rounded-xl border border-slate-200 p-4"><p className="font-semibold text-slate-900">{response.student_name}{response.student_id ? ` · ${response.student_id}` : ''}</p><p className="text-xs text-slate-400 mt-1">{new Date(response.created_at).toLocaleString()}</p><div className="mt-3 space-y-2">{responses.form.questions.map((question, index) => <p key={question.id} className="text-sm text-slate-700"><span className="font-medium">{question.prompt}</span><br /><span className="text-slate-600">{response.answers[question.id]}{question.type === 'rating' ? ' / 5' : ''}</span></p>)}</div></article>)}</div>}</div></div>}
  </div>;
}
