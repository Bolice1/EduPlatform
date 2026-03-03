import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../api';
import { useToast } from '../components/Toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = Array.from({ length: 10 }, (_, i) => {
  const hour = 7 + i;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const s = {
  page: { padding: '2rem' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '1.75rem', fontFamily: 'var(--font-serif)', margin: 0, marginBottom: '0.5rem' },
  subtitle: { color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' },
  filters: { display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' },
  select: { padding: '0.6rem 1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)', fontSize: '0.95rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5px', marginBottom: '2rem', border: '1px solid var(--color-border)' },
  dayHeader: { padding: '1rem', background: 'var(--color-accent)', color: 'white', fontWeight: 600, textAlign: 'center', fontSize: '0.95rem' },
  timeHeader: { padding: '1rem', background: 'var(--color-bg)', fontWeight: 600, textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-muted)' },
  cell: (color) => ({
    padding: '0.75rem', background: color ? `${color}20` : 'transparent', border: '1px solid var(--color-border)', minHeight: '80px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '0.8rem', fontWeight: 500, borderRadius: '4px', transition: 'background 0.2s',
  }),
  empty: { textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' },
  btn: { padding: '0.6rem 1.2rem', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500 },
};

const CLASS_LEVELS = ['Senior 1', 'Senior 2', 'Senior 3', 'Senior 4', 'Senior 5', 'Senior 6', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'];
const TERMS = ['Term 1', 'Term 2', 'Term 3'];
const ACADEMIC_YEARS = ['2024', '2025', '2026'];

export default function Timetable() {
  const { user } = useSelector((st) => st.auth);
  const { toast } = useToast();
  const isAdmin = user?.role === 'school_admin';

  const [timetables, setTimetables] = useState([]);
  const [classLevel, setClassLevel] = useState('Senior 1');
  const [term, setTerm] = useState('Term 1');
  const [academicYear, setAcademicYear] = useState('2024');
  const [loading, setLoading] = useState(false);

  const loadTimetables = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/timetable?classLevel=${classLevel}&term=${term}&academicYear=${academicYear}`);
      setTimetables(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load timetable');
      setTimetables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTimetables(); }, [classLevel, term, academicYear]);

  const getColorForCourse = (courseName) => {
    const hash = courseName.charCodeAt(0) % COLORS.length;
    return COLORS[hash];
  };

  const getClassForSlot = (day, time) => {
    return timetables.find(t => t.day_of_week === day && t.start_time === time);
  };

  const renderGrid = () => {
    return (
      <div style={s.grid}>
        {/* Header row */}
        <div style={s.timeHeader}>Time</div>
        {DAYS.map(day => <div key={day} style={s.dayHeader}>{day}</div>)}

        {/* Time slots */}
        {TIME_SLOTS.map(time => (
          <div key={`row-${time}`}>
            <div style={s.timeHeader}>{time}</div>
            {DAYS.map(day => {
              const cls = getClassForSlot(day, time);
              const color = cls ? getColorForCourse(cls.course_name) : null;
              return (
                <div
                  key={`${day}-${time}`}
                  style={s.cell(color)}
                  title={cls ? `${cls.course_name} - ${cls.teacher_first_name || 'No'} ${cls.teacher_last_name || 'Teacher'}` : ''}
                >
                  {cls && (
                    <div>
                      <div style={{ fontWeight: 600 }}>{cls.course_code}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        {cls.teacher_first_name} {cls.teacher_last_name}
                      </div>
                      {cls.room && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Room {cls.room}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <div style={s.page}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>📅 Timetable</h1>
        <p style={s.subtitle}>Weekly class schedule</p>
      </div>

      <div style={s.filters}>
        <select style={s.select} value={classLevel} onChange={e => setClassLevel(e.target.value)}>
          {CLASS_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={s.select} value={term} onChange={e => setTerm(e.target.value)}>
          {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select style={s.select} value={academicYear} onChange={e => setAcademicYear(e.target.value)}>
          {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {timetables.length === 0 && !loading ? (
        <div style={s.empty}>
          <p style={{ fontSize: '3rem', margin: 0 }}>📚</p>
          <p>No timetable available for this class</p>
          {isAdmin && <button style={s.btn}>+ Add Classes</button>}
        </div>
      ) : (
        renderGrid()
      )}
    </div>
  );
}
