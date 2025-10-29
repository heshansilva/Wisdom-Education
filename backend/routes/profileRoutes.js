import express from 'express';
const router = express.Router();
import {
  getTeacherProfile,
  updateTeacherProfile,
  uploadProfileLogo,
} from '../controllers/profileController.js'; 
import { protect, isTeacher } from '../middleware/authMiddleware.js'; 

// Apply protect and isTeacher middleware to all routes in this file
router.use(protect, isTeacher);

// Define routes for /api/profile/teacher
router.route('/teacher')
  .get(getTeacherProfile)      // GET request fetches the profile
  .put(updateTeacherProfile);    // PUT request updates the profile

// Add route for logo upload
router.route('/teacher/logo').post(uploadProfileLogo);

export default router; // Use ES Module export
