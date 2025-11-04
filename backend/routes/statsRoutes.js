import express from 'express';
const router = express.Router();
import { getTeacherStats, getStudentStats } from '../controllers/statsController.js'; 
import { protect, isTeacher } from '../middleware/authMiddleware.js';

// --- Teacher Stats Route ---
// GET /api/stats/teacher
// This route is private and only accessible by teachers
router.get('/teacher', protect, isTeacher, getTeacherStats);

// --- Student Stats Route ---
// GET /api/stats/student
// This route is private and accessible by any logged-in user (role check is in controller)
router.get('/student', protect, getStudentStats); 

export default router;

