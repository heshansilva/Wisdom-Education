import asyncHandler from 'express-async-handler';
import Payment from '../models/Payment.js';
import User from '../models/User.js'; // To verify student exists
import Class from '../models/Class.js'; // To verify class exists

// @desc    Record a new payment for a student
// @route   POST /api/payments
// @access  Private (Teacher)
const recordPayment = asyncHandler(async (req, res) => {
  const { studentId, classId, amount, feeMonth, feeYear } = req.body;
  const teacherId = req.user._id; // Logged-in teacher

  // Basic validation
  if (!studentId || !classId || !amount || !feeMonth || !feeYear) {
    res.status(400);
    throw new Error('Please provide student, class, amount, month, and year');
  }

  // Check if student and class exist
  const student = await User.findById(studentId);
  const classItem = await Class.findById(classId);

  if (!student || student.role !== 'student') {
    res.status(404);
    throw new Error('Student not found');
  }
  if (!classItem) {
    res.status(404);
    throw new Error('Class not found');
  }
  // Check if class belongs to this teacher
  if (classItem.teacher.toString() !== teacherId.toString()) {
     res.status(403);
     throw new Error('You are not authorized to record payments for this class');
  }

  // Create and save the payment
  const payment = await Payment.create({
    student: studentId,
    teacher: teacherId,
    class: classId,
    amount,
    feeMonth,
    feeYear,
    paymentDate: new Date(), // Record payment as of right now
  });

  res.status(201).json(payment);
});

// @desc    Get payment history for the logged-in student
// @route   GET /api/payments/mypayments
// @access  Private (Student)
const getStudentPaymentHistory = asyncHandler(async (req, res) => {
  // Find all payments where the student is the logged-in user
  const payments = await Payment.find({ student: req.user._id })
    .populate('class', 'subject grade') // Get class subject/grade
    .populate('teacher', 'name') // Get teacher's name
    .sort({ paymentDate: -1 }); // Show newest payments first

  res.status(200).json(payments);
});

export { recordPayment, getStudentPaymentHistory };
