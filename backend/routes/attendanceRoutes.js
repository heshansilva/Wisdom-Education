import express from 'express';
const router = express.Router();
import {
  markAttendance,
  getStudentAttendance,
  getClassAttendance,
} from '../controllers/attendanceController.js';
import { protect, isTeacher } from '../middleware/authMiddleware.js';

// --- Student Route ---
// GET /api/attendance/myattendance
// Any logged-in user (student) can get their *own* attendance
router.get('/myattendance', protect, getStudentAttendance);

// --- Teacher Routes ---
// POST /api/attendance (Mark attendance)
router.post('/', protect, isTeacher, markAttendance);

// GET /api/attendance/class/:classId (Get attendance for a class on a date)
router.get('/class/:classId', protect, isTeacher, getClassAttendance);


export default router;
