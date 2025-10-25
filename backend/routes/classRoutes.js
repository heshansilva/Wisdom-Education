import express from 'express';
import { createClass } from '../controllers/classController.js';
import { protect, isTeacher } from '../middleware/authMiddleware.js';

const router = express.Router();

// When a POST request is made to '/', it first runs 'protect'.
// If that passes, it runs 'isTeacher'.
// If that passes, it finally runs 'createClass'.
router.post('/', protect, isTeacher, createClass);


export default router;