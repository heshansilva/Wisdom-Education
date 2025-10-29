import express from 'express';
import { registerUser, loginUser, getUserProfile, getStudents } from '../controllers/userController.js';
import { protect, isTeacher } from '../middleware/authMiddleware.js';

const router = express.Router();

// Define the route for user registration
// A POST request to /api/users/register will call the registerUser function
// --- PUBLIC ROUTES ---
// Anyone can access these
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- PRIVATE ROUTES ---
// Only a logged-in user with a valid token can access this
// The 'protect' middleware runs first. If the token is valid, it calls next()
// which then runs the getUserProfile controller.
router.get('/profile', protect, getUserProfile);

// Get a list of all students (only accessible by teachers)
router.get('/students', protect, isTeacher, getStudents);

// Export the router
export default router;
