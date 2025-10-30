import express from 'express';
const router = express.Router();
import {
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  getStudentLessons 
} from '../controllers/lessonController.js';
import { protect, isTeacher } from '../middleware/authMiddleware.js';
import { uploadPDF } from '../middleware/uploadMiddleware.js';

// Student route
// Requires login (protect), but accessible by any role (student/teacher)
router.get('/student', protect, getStudentLessons); 

// --- Teacher Routes ---
// Routes for /api/lessons
router.route('/')
  .get(protect, isTeacher, getLessons)
  .post(protect, isTeacher, uploadPDF, createLesson);

// Routes for /api/lessons/:id
router.route('/:id')
  // Apply protect and isTeacher middleware specifically here
  .all(protect, isTeacher) // .all() applies middleware to all methods (PUT, DELETE) on this path
  .put(updateLesson)
  .delete(deleteLesson);

export default router;

