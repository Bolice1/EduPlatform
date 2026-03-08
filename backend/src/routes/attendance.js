const express = require('express');
const router = express.Router();
// let us load the attandance controllers from the controllers 
const attendanceController = require('../controllers/attendanceController');
const { authenticate, authorize, requireSchoolContext } = require('../middleware/auth');
const { assertSchoolAccess } = require('../middleware/schoolAccess');
const { handleValidation } = require('../middleware/validate');
const { createAttendanceRules } = require('../validators/entityValidators');

router.use(authenticate, requireSchoolContext, assertSchoolAccess);

router.get('/students', authorize('super_admin', 'school_admin', 'dean', 'teacher'), attendanceController.listStudents);
router.get('/teachers', authorize('super_admin', 'school_admin', 'dean'), attendanceController.listTeachers);
router.post('/', authorize('super_admin', 'school_admin', 'dean', 'teacher'), createAttendanceRules, handleValidation, attendanceController.record);

module.exports = router;
// the above is the attandance router configuration 