import express from 'express';
const router = express.Router();
import {
  recordPayment,
  getStudentPaymentHistory,
} from '../controllers/paymentController.js';
import { protect, isTeacher } from '../middleware/authMiddleware.js';

// --- Teacher Route ---
// POST /api/payments
// Only a teacher can record a new payment
router.post('/', protect, isTeacher, recordPayment);

// --- Student Route ---
// GET /api/payments/mypayments
// Any logged-in user (student) can get their *own* payment history
router.get('/mypayments', protect, getStudentPaymentHistory);


export default router;
