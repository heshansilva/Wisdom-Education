import express from 'express';
const router = express.Router();
import {
  getTeacherProfile,
  updateTeacherProfile,
  uploadProfileLogo,
  uploadMainImage,
  getPublicTeacherProfile
} from '../controllers/profileController.js';
import { protect, isTeacher } from '../middleware/authMiddleware.js';
// Import the *named export* for the logo uploader
import { uploadImage } from '../middleware/uploadMiddleware.js'; 

// We do this because the field name ('mainImage') is different from the logo ('profileLogo')
import multer from 'multer';

router.get('/public/:userId', getPublicTeacherProfile);

const imageStorage = multer.memoryStorage();
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) { cb(null, true); } 
  else { cb(new Error('Invalid file type, only images are allowed!'), false); }
};
// This instance expects a field named 'mainImage'
const uploadMainImageMiddleware = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('mainImage'); // 
// ---

// Apply protect and isTeacher middleware to all routes in this file
router.use(protect, isTeacher);

// --- Define routes for /api/profile/teacher ---
router.route('/teacher')
  .get(getTeacherProfile)      // GET fetches the profile
  .put(updateTeacherProfile);    // PUT updates the text fields

// --- Route for Logo Upload ---
// Uses 'uploadImage' which expects the field 'profileLogo'
router.put('/teacher/logo', uploadImage, uploadProfileLogo);

// --- ROUTE for Main Image Upload ---
// Uses 'uploadMainImageMiddleware' which expects the field 'mainImage'
router.put('/teacher/main-image', uploadMainImageMiddleware, uploadMainImage);

export default router;

