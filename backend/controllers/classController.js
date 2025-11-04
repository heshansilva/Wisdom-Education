import asyncHandler from 'express-async-handler'; 
import Class from '../models/Class.js';
import User from '../models/User.js'; // We'll need this to check on students

// @desc    Get all classes for the logged-in teacher
// @route   GET /api/classes
// @access  Private (Teacher)
const getClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find({ teacher: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(classes);
});

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private (Teacher)
const createClass = asyncHandler(async (req, res) => {
  const { subject, grade, area, time, price } = req.body;
  if (!subject || !grade || price === undefined) {
    res.status(400);
    throw new Error('Please add subject, grade, and price');
  }
  const classItem = await Class.create({
    teacher: req.user._id,
    subject,
    grade,
    area,
    time,
    price,
  });
  res.status(201).json(classItem);
});

// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Private (Teacher)
const updateClass = asyncHandler(async (req, res) => {
  const classItem = await Class.findById(req.params.id);
  if (!classItem) {
    res.status(404); throw new Error('Class not found');
  }
  if (classItem.teacher.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('User not authorized');
  }
  
  const { subject, grade, area, time, price } = req.body;
  classItem.subject = subject || classItem.subject;
  classItem.grade = grade || classItem.grade;
  classItem.area = area || classItem.area;
  classItem.time = time || classItem.time;
  classItem.price = price !== undefined ? price : classItem.price;

  const updatedClass = await classItem.save();
  res.status(200).json(updatedClass);
});

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private (Teacher)
const deleteClass = asyncHandler(async (req, res) => {
  const classItem = await Class.findById(req.params.id);
  if (!classItem) {
    res.status(404); throw new Error('Class not found');
  }
  if (classItem.teacher.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('User not authorized');
  }
  await Class.findByIdAndDelete(req.params.id);
  res.status(200).json({ id: req.params.id, message: 'Class deleted' });
});


// --- ENROLLMENT FUNCTIONS (TEACHER) ---

// @desc    Get all students enrolled in a specific class
// @route   GET /api/classes/:id/students
// @access  Private (Teacher)
const getEnrolledStudents = asyncHandler(async (req, res) => {
  const classItem = await Class.findById(req.params.id).populate('students', 'name email phone'); // Populate student details
  
  if (!classItem) {
    res.status(404); throw new Error('Class not found');
  }
  // Check if teacher owns this class
  if (classItem.teacher.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('User not authorized');
  }
  
  res.status(200).json(classItem.students);
});

// @desc    Enroll a student into a class
// @route   PUT /api/classes/:id/enroll
// @access  Private (Teacher)
const enrollStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const classId = req.params.id;

  if (!studentId) {
    res.status(400); throw new Error('Student ID is required');
  }

  const classItem = await Class.findById(classId);
  const student = await User.findById(studentId);

  if (!classItem) { res.status(404); throw new Error('Class not found'); }
  if (!student || student.role !== 'student') { res.status(404); throw new Error('Student not found'); }
  if (classItem.teacher.toString() !== req.user._id.toString()) { res.status(403); throw new Error('User not authorized'); }

  // Check if student is already enrolled
  const isEnrolled = classItem.students.some(studId => studId.toString() === studentId);
  
  if (isEnrolled) {
    res.status(400); throw new Error('Student is already enrolled in this class');
  }

  // Add student to the array
  classItem.students.push(studentId);
  await classItem.save();
  
  // Find the student again to populate details (or use the populated data from the 'student' variable)
  const enrolledStudentDetails = await User.findById(studentId).select('-password');
  res.status(201).json(enrolledStudentDetails); // Send back the full student details
});

// @desc    Remove (unenroll) a student from a class
// @route   PUT /api/classes/:id/unenroll
// @access  Private (Teacher)
const unenrollStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const classId = req.params.id;

  const classItem = await Class.findById(classId);

  if (!classItem) { res.status(404); throw new Error('Class not found'); }
  if (classItem.teacher.toString() !== req.user._id.toString()) { res.status(403); throw new Error('User not authorized'); }

  // Pull (remove) the studentId from the students array
  classItem.students.pull(studentId);
  await classItem.save();
  
  res.status(200).json({ studentId, message: 'Student unenrolled successfully' });
});


// --- NEW FUNCTION (STUDENT) ---

// @desc    Get all classes the logged-in student is enrolled in
// @route   GET /api/classes/myclasses
// @access  Private (Student)
const getStudentClasses = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    res.status(403); throw new Error('Only students can access this route');
  }

  // Find all classes where the 'students' array contains the logged-in user's ID
  const classes = await Class.find({ students: req.user._id })
    .populate('teacher', 'name') // Get teacher's name
    .select('subject grade time teacher'); // Only select fields the student needs

  res.status(200).json(classes);
});

// --- EXPORTS ---
export {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getEnrolledStudents,
  enrollStudent,
  unenrollStudent,
  getStudentClasses
};

