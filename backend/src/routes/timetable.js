const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { authenticate, authorize, requireSchoolContext } = require('../middleware/auth');

router.use(authenticate, requireSchoolContext);

router.get('/', authorize('school_admin', 'teacher', 'student', 'dean', 'patron', 'matron'), timetableController.list);
router.post('/', authorize('school_admin'), timetableController.create);
router.put('/:id', authorize('school_admin'), timetableController.update);
router.delete('/:id', authorize('school_admin'), timetableController.remove);

module.exports = router;
