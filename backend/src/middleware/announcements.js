const { query } = require('../config/database');

async function canPostAnnouncement(req, res, next) {
  try {
    const allowedRoles = ['super_admin', 'school_admin', 'teacher', 'dean', 'bursar', 'patron', 'matron'];
    
    // Direct role check
    if (allowedRoles.includes(req.userRole)) {
      return next();
    }

    // Check if student is a prefect (head_boy/head_girl)
    if (req.userRole === 'student') {
      const students = await query(
        'SELECT is_prefect FROM students WHERE user_id = ?',
        [req.userId]
      );
      const student = students[0];// this is to check if a student is a headboy/or headgirl`
      if (student && student.is_prefect && student.is_prefect !== 'none') {
        return next();
      }
    }

    return res.status(403).json({ error: 'You do not have permission to post announcements' });
  } catch (err) {
    next(err);
  }
}

module.exports = { canPostAnnouncement };
