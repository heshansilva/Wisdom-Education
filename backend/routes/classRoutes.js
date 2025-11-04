import express from 'express';
import asyncHandler from 'express-async-handler';
const router = express.Router();
import {
  getClasses, createClass, updateClass, deleteClass,
  getEnrolledStudents, enrollStudent, unenrollStudent, getStudentClasses
} from '../controllers/classController.js';
import { protect, isTeacher } from '../middleware/authMiddleware.js';

// --- STUDENT ROUTE ---
// Must be defined *before* the restricted /:id routes
// GET /api/classes/myclasses
router.get('/myclasses', protect, getStudentClasses); // protect only, for students

// --- TEACHER ROUTES ---
// GET /api/classes
// POST /api/classes
router.route('/')
  .all(protect, isTeacher)
  .get(getClasses)
  .post(createClass);

// GET /api/classes/:id/students (Teacher gets enrolled students)
router.get('/:id/students', protect, isTeacher, getEnrolledStudents); 

// PUT /api/classes/:id/enroll (Teacher enrolls a student)
router.put('/:id/enroll', protect, isTeacher, enrollStudent); 

// PUT /api/classes/:id/unenroll (Teacher unenrolls a student)
router.put('/:id/unenroll', protect, isTeacher, unenrollStudent); 

// GET /api/classes/:id 
// PUT /api/classes/:id
// DELETE /api/classes/:id
router.route('/:id')
  .all(protect, isTeacher)
  .get(asyncHandler(async (req, res) => {  })) // Placeholder for getSingleClass
  .put(updateClass)
  .delete(deleteClass);

export default router;
