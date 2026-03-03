const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

function getSchoolId(req) {
  return req.schoolId;
}

async function list(req, res, next) {
  try {
    const schoolId = getSchoolId(req);
    const { classLevel, term, academicYear, dayOfWeek } = req.query;

    let where = 'WHERE t.school_id = ? AND t.is_active = 1';
    const params = [schoolId];

    if (classLevel) {
      where += ' AND t.class_level = ?';
      params.push(classLevel);
    }
    if (term) {
      where += ' AND t.term = ?';
      params.push(term);
    }
    if (academicYear) {
      where += ' AND t.academic_year = ?';
      params.push(academicYear);
    }
    if (dayOfWeek) {
      where += ' AND t.day_of_week = ?';
      params.push(dayOfWeek);
    }

    const rows = await query(
      `SELECT t.*, c.name as course_name, c.code as course_code,
              u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM timetables t
       LEFT JOIN courses c ON t.course_id = c.id
       LEFT JOIN teachers tc ON t.teacher_id = tc.id
       LEFT JOIN users u ON tc.user_id = u.id
       ${where}
       ORDER BY t.day_of_week, t.start_time`,
      params
    );

    res.json(rows);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const schoolId = getSchoolId(req);
    const { courseId, teacherId, classLevel, section, dayOfWeek, startTime, endTime, room, academicYear, term } = req.body;

    if (!courseId || !classLevel || !dayOfWeek || !startTime || !endTime || !academicYear || !term) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    await query(
      `INSERT INTO timetables (id, school_id, course_id, teacher_id, class_level, section, day_of_week, start_time, end_time, room, academic_year, term)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, schoolId, courseId, teacherId || null, classLevel, section || 'A', dayOfWeek, startTime, endTime, room || null, academicYear, term]
    );

    const rows = await query(
      `SELECT t.*, c.name as course_name, c.code as course_code,
              u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM timetables t
       LEFT JOIN courses c ON t.course_id = c.id
       LEFT JOIN teachers tc ON t.teacher_id = tc.id
       LEFT JOIN users u ON tc.user_id = u.id
       WHERE t.id = ?`,
      [id]
    );

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const schoolId = getSchoolId(req);
    const { courseId, teacherId, classLevel, section, dayOfWeek, startTime, endTime, room, academicYear, term } = req.body;

    const existing = await query('SELECT id FROM timetables WHERE id = ? AND school_id = ?', [id, schoolId]);
    if (!existing[0]) return res.status(404).json({ error: 'Timetable entry not found' });

    const updates = {};
    if (courseId) updates.course_id = courseId;
    if (teacherId !== undefined) updates.teacher_id = teacherId || null;
    if (classLevel) updates.class_level = classLevel;
    if (section) updates.section = section;
    if (dayOfWeek) updates.day_of_week = dayOfWeek;
    if (startTime) updates.start_time = startTime;
    if (endTime) updates.end_time = endTime;
    if (room !== undefined) updates.room = room || null;
    if (academicYear) updates.academic_year = academicYear;
    if (term) updates.term = term;

    const set = [];
    const vals = [];
    for (const [k, v] of Object.entries(updates)) {
      set.push(`${k} = ?`);
      vals.push(v);
    }

    if (set.length > 0) {
      vals.push(id);
      await query(`UPDATE timetables SET ${set.join(', ')} WHERE id = ?`, vals);
    }

    const rows = await query(
      `SELECT t.*, c.name as course_name, c.code as course_code,
              u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM timetables t
       LEFT JOIN courses c ON t.course_id = c.id
       LEFT JOIN teachers tc ON t.teacher_id = tc.id
       LEFT JOIN users u ON tc.user_id = u.id
       WHERE t.id = ?`,
      [id]
    );

    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const schoolId = getSchoolId(req);

    const timetable = await query('SELECT id FROM timetables WHERE id = ? AND school_id = ?', [id, schoolId]);
    if (!timetable[0]) return res.status(404).json({ error: 'Timetable entry not found' });

    await query('DELETE FROM timetables WHERE id = ?', [id]);
    res.json({ message: 'Timetable entry deleted' });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
