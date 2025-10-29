import express from 'express';

const router = express.Router();
import { getVideos, createVideo, updateVideo, deleteVideo } from '../controllers/videoController.js';
import { protect, isTeacher } from '../middleware/authMiddleware.js';
// Apply protect and isTeacher middleware to all routes in this file
router.use(protect, isTeacher);

// Routes for /api/videos
router.route('/')
  .get(getVideos)
  .post(createVideo);

// Routes for /api/videos/:id
router.route('/:id')
  .put(updateVideo)
  .delete(deleteVideo);

export default router;
