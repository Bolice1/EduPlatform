import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../api';
import DataTable from '../components/DataTable';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    class_level: '',
    teacher_id: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const user = useSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'school_admin' || user?.role === 'super_admin';

  // Load courses and teachers
  useEffect(() => {
    let canceled = false;
    Promise.all([
      api.get('/courses').catch(() => ({ data: [] })),
      api.get('/teachers').catch(() => ({ data: [] })),
    ]).then(([coursesRes, teachersRes]) => {
      if (!canceled) {
        const coursesData = coursesRes.data;
        const teachersData = teachersRes.data;
        setCourses(Array.isArray(coursesData) ? coursesData : coursesData?.courses || []);
        setTeachers(Array.isArray(teachersData) ? teachersData : teachersData?.teachers || []);
      }
    });
    return () => { canceled = true; };
  }, []);

  const handleOpenModal = (course = null) => {
    if (course) {
      setFormData({
        code: course.code || '',
        name: course.name || '',
        class_level: course.class_level || '',
        teacher_id: course.teacher_id || '',
      });
      setIsEditing(true);
    } else {
      setFormData({ code: '', name: '', class_level: '', teacher_id: '' });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ code: '', name: '', class_level: '', teacher_id: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      Toast.error('Course code and name are required');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        const courseId = courses.find(
          (c) => c.code === formData.code && c.name === formData.name
        )?.id;
        if (!courseId) return;
        const payload = {
          code: formData.code,
          name: formData.name,
          class_level: formData.class_level || null,
          teacher_id: formData.teacher_id || null,
        };
        const response = await api.put(`/courses/${courseId}`, payload);
        setCourses(courses.map((c) => (c.id === courseId ? response.data : c)));
        Toast.success('Course updated successfully');
      } else {
        const payload = {
          code: formData.code,
          name: formData.name,
          class_level: formData.class_level || null,
          teacher_id: formData.teacher_id || null,
        };
        const response = await api.post('/courses', payload);
        setCourses([...courses, response.data]);
        Toast.success('Course created successfully');
      }
      handleCloseModal();
    } catch (err) {
      Toast.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    setLoading(true);
    try {
      await api.delete(`/courses/${courseId}`);
      setCourses(courses.filter((c) => c.id !== courseId));
      Toast.success('Course deleted successfully');
      setDeleteConfirm(null);
    } catch (err) {
      Toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'class_level', label: 'Level' },
    {
      label: 'Teacher',
      render: (r) =>
        r.teacher_first_name && r.teacher_last_name
          ? `${r.teacher_first_name} ${r.teacher_last_name}`
          : r.teacher_employee_id || '—',
    },
  ];

  if (isAdmin) {
    columns.push({
      label: 'Actions',
      render: (r) => (
        <div style={styles.actions}>
          <button
            onClick={() => handleOpenModal(r)}
            style={styles.editBtn}
            disabled={loading}
          >
            Edit
          </button>
          <button
            onClick={() => setDeleteConfirm(r)}
            style={styles.deleteBtn}
            disabled={loading}
          >
            Delete
          </button>
        </div>
      ),
    });
  }
// these are sample classes for development services 

// not real ones 
  const classLevels = [
    'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
    'Senior 1', 'Senior 2', 'Senior 3', 'Senior 4', 'Senior 5', 'Senior 6',
  ];

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Courses</h1>
        {isAdmin && (
          <button
            onClick={() => handleOpenModal()}
            style={styles.addBtn}
            disabled={loading}
          >
            + Add Course
          </button>
        )}
      </div>

      <DataTable columns={columns} data={courses} />

      {showModal && (
        <div style={styles.overlay} onClick={handleCloseModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {isEditing ? 'Edit Course' : 'Add Course'}
            </h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Course Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  style={styles.input}
                  disabled={loading}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Course Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  style={styles.input}
                  disabled={loading}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Class Level</label>
                <select
                  value={formData.class_level}
                  onChange={(e) =>
                    setFormData({ ...formData, class_level: e.target.value })
                  }
                  style={styles.input}
                  disabled={loading}
                >
                  <option value="">— Select Level —</option>
                  {classLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Teacher</label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) =>
                    setFormData({ ...formData, teacher_id: e.target.value })
                  }
                  style={styles.input}
                  disabled={loading}
                >
                  <option value="">— Unassigned —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formActions}>
                <button
                  type="submit"
                  style={styles.submitBtn}
                  disabled={loading}
                >
                  {loading
                    ? 'Saving...'
                    : isEditing
                      ? 'Update'
                      : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={styles.cancelBtn}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Course"
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
          onConfirm={() => handleDelete(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
          isDangerous={true}
          disabled={loading}
        />
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    margin: 0,
    fontSize: '1.75rem',
  },
  addBtn: {
    padding: '0.75rem 1.5rem',
    background: 'var(--color-accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
  },
  editBtn: {
    padding: '0.5rem 1rem',
    background: 'var(--color-accent)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  deleteBtn: {
    padding: '0.5rem 1rem',
    background: 'var(--color-danger)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'var(--color-surface)',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalTitle: {
    margin: '0 0 1.5rem 0',
    fontSize: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontWeight: '600',
    color: 'var(--color-text)',
    fontSize: '0.95rem',
  },
  input: {
    padding: '0.75rem 1rem',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontSize: '1rem',
  },
  formActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  submitBtn: {
    padding: '0.75rem 1.5rem',
    background: 'var(--color-accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    flex: 1,
  },
  cancelBtn: {
    padding: '0.75rem 1.5rem',
    background: 'var(--color-border)',
    color: 'var(--color-text)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    flex: 1,
  },
};
