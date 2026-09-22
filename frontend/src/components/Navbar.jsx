import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, LogIn, LogOut, GraduationCap } from 'lucide-react';

export function Navbar({ onOpenLogin }) {
  const { user, role, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-blue-500 text-white p-2 rounded-xl shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent">
                B.Tech Student ERP
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                4-Year Degree
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-800">{user.full_name || user.username}</p>
                  <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    {role}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600">
                  <User className="w-5 h-5" />
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 text-sm text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm hover:shadow transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In (Admin)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

