import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Users, GraduationCap, CalendarCheck, CreditCard, ArrowRight, Activity, Award } from 'lucide-react';

export function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider">
            Academic Year 2026
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
            Welcome to B.Tech Student ERP
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Manage student registrations, track attendance, record semester marks, and monitor fee collections across all 10 B.Tech engineering branches.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('students')}
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-4 py-2 rounded-xl text-sm shadow transition flex items-center space-x-2"
            >
              <span>Manage Students</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('attendance')}
              className="bg-indigo-800/60 hover:bg-indigo-800 text-white font-semibold px-4 py-2 rounded-xl text-sm border border-indigo-400/30 transition flex items-center space-x-2"
            >
              <span>Take Attendance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Enrolled</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
              {loading ? '...' : stats?.total_students ?? 0}
            </h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1">B.Tech Students</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">B.Tech Branches</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
              {loading ? '...' : stats?.total_courses ?? 10}
            </h3>
            <p className="text-xs text-indigo-600 font-semibold mt-1">4-Year Programs</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Today's Attendance</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
              {loading ? '...' : stats?.today_attendance_records ?? 0}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Present / Absent Logs</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Pending Fees</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
              {loading ? '...' : `₹${Number(stats?.total_pending_fees || 0).toLocaleString()}`}
            </h3>
            <p className="text-xs text-amber-600 font-semibold mt-1">Outstanding Dues</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
              <Users className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
          </div>
          <h4 className="font-bold text-slate-900 mt-4 text-base">Student Directory & Marks</h4>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter by branch & year (1–4), and monitor real-time computed average marks.
          </p>
        </div>

        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
          </div>
          <h4 className="font-bold text-slate-900 mt-4 text-base">Attendance Tracker</h4>
          <p className="text-xs text-slate-500 mt-1">
            Mark daily class attendance strictly with Present / Absent and review student attendance percentages.
          </p>
        </div>

        <div
          onClick={() => onNavigate('marks')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
              <Award className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition" />
          </div>
          <h4 className="font-bold text-slate-900 mt-4 text-base">Examinations & Transcripts</h4>
          <p className="text-xs text-slate-500 mt-1">
            Enter marks, view letter grades (A+ to F), and auto-sync student academic records in SQLite.
          </p>
        </div>
      </div>
    </div>
  );
}

