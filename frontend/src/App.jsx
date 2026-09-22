import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Students } from './components/Students';
import { Courses } from './components/Courses';
import { Attendance } from './components/Attendance';
import { Fees } from './components/Fees';
import { Marks } from './components/Marks';
import { LoginModal } from './components/LoginModal';
import { LayoutDashboard, Users, GraduationCap, CalendarCheck, CreditCard, Award } from 'lucide-react';

function AppContent() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onOpenLogin={() => setIsLoginModalOpen(true)} />

      <div className="flex-1 flex">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          {currentTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} />}
          {currentTab === 'students' && <Students />}
          {currentTab === 'courses' && <Courses />}
          {currentTab === 'attendance' && <Attendance />}
          {currentTab === 'fees' && <Fees />}
          {currentTab === 'marks' && <Marks />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-1 flex justify-around items-center z-40">
        {[
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'attendance', label: 'Attend', icon: CalendarCheck },
          { id: 'fees', label: 'Fees', icon: CreditCard },
          { id: 'marks', label: 'Marks', icon: Award },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold ${
                isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

