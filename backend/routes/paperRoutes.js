import express from 'express';
const router = express.Router();
import {
  getPapers,
  createPaper,
  updatePaper,
  deletePaper,
  getStudentPapers // <-- Import new controller
} from '../controllers/paperController.js';
import { protect, isTeacher } from '../middleware/authMiddleware.js';
import { uploadPDF } from '../middleware/uploadMiddleware.js';

// --- Student Route ---
// This route ONLY requires login (protect), not isTeacher
// Place it BEFORE the teacher routes that might use similar base paths or middleware patterns
router.get('/student', protect, getStudentPapers); // <-- NEW ROUTE for students

// --- Teacher Routes ---
// Apply protect and isTeacher middleware specifically to these routes

// Routes for /api/papers
router.route('/')
  .all(protect, isTeacher) // Apply middleware to GET and POST on this path
  .get(getPapers)
  .post(uploadPDF, createPaper);

// Routes for /api/papers/:id
router.route('/:id')
  .all(protect, isTeacher) // Apply middleware to PUT and DELETE on this path
  .put(updatePaper)
  .delete(deletePaper);

export default router;

