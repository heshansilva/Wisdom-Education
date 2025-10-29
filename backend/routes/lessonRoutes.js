import express from 'express';
const router = express.Router();
import {
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
} from '../controllers/lessonController.js';
import { protect, isTeacher } from '../middleware/authMiddleware.js';
// --- CORRECTED IMPORT SYNTAX ---
// Import the specific named export for PDF uploads
import { uploadPDF } from '../middleware/uploadMiddleware.js';

// Apply protect and isTeacher middleware to all routes initially
router.use(protect, isTeacher);

// Routes for /api/lessons
router.route('/')
  .get(getLessons)
  // Use the correctly imported uploadPDF middleware
  .post(uploadPDF, createLesson); // Multer processes the file first

// Routes for /api/lessons/:id
router.route('/:id')
  .put(updateLesson)
  .delete(deleteLesson);

export default router;

