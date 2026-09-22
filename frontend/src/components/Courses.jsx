import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { GraduationCap, BookOpen, Clock, Building } from 'lucide-react';

export function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await api.getCourses();
        setCourses(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">B.Tech Engineering Programs</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Accredited 4-year undergraduate Bachelor of Technology programs offered by the institution.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading B.Tech course catalog...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => (
            <div
              key={c.id || c.course_code}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-indigo-400 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                    {c.course_code}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{c.duration_years || 4} Years</span>
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-3 leading-snug">
                  {c.name}
                </h3>

                <p className="text-xs text-slate-500 mt-2 flex items-center space-x-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.department}</span>
                </p>

                {c.description && (
                  <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                    {c.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                <span>Undergraduate Degree</span>
                <span className="font-semibold text-emerald-600">Active Program</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

