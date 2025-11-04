import asyncHandler from 'express-async-handler';
import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';

// @desc    Mark attendance for a class
// @route   POST /api/attendance
// @access  Private (Teacher)
const markAttendance = asyncHandler(async (req, res) => {
  const { classId, classDate, attendanceData } = req.body; // attendanceData = [{ studentId: '...', status: 'Present' }, ...]
  const teacherId = req.user._id;

  if (!classId || !classDate || !attendanceData || !Array.isArray(attendanceData) || attendanceData.length === 0) {
    res.status(400);
    throw new Error('Please provide class ID, date, and valid attendance data');
  }

  // Verify teacher owns the class
  const classItem = await Class.findById(classId);
  if (!classItem || classItem.teacher.toString() !== teacherId.toString()) {
    res.status(403);
    throw new Error('User not authorized to mark attendance for this class');
  }

  // Use bulk operations for efficiency
  // This will update existing records or insert new ones (upsert)
  const operations = attendanceData.map(record => ({
    updateOne: {
      filter: { // Find a record matching this
        student: record.studentId,
        class: classId,
        classDate: new Date(classDate),
      },
      update: { // Update with this data, or insert if not found
        $set: {
          student: record.studentId,
          class: classId,
          classDate: new Date(classDate),
          teacher: teacherId,
          status: record.status,
          notes: record.notes || '',
        }
      },
      upsert: true, // This is the key: insert if it doesn't exist
    }
  }));

  try {
    const result = await Attendance.bulkWrite(operations);
    res.status(201).json({ 
      message: 'Attendance recorded successfully', 
      result: result 
    });
  } catch (error) {
    console.error('Attendance Bulk Write Error:', error);
    // Handle potential duplicate key errors if index is strictly enforced
    if (error.code === 11000) {
      res.status(409); // Conflict
      throw new Error('A duplicate attendance record was detected.');
    }
    res.status(500);
    throw new Error('Server error while recording attendance.');
  }
});

// @desc    Get attendance for a specific class on a specific date (for Teacher)
// @route   GET /api/attendance/class/:classId
// @access  Private (Teacher)
const getClassAttendance = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { date } = req.query; // Get date from query string, e.g., ?date=2025-10-30

  if (!date) {
    res.status(400);
    throw new Error('Please provide a date');
  }

  // Find attendance records matching class, date
  const attendanceRecords = await Attendance.find({
    class: classId,
    classDate: new Date(date),
    teacher: req.user._id, // Ensure teacher can only get their own records
  }).populate('student', 'name'); // Populate student's name

  res.status(200).json(attendanceRecords);
});


// @desc    Get attendance history for the logged-in student
// @route   GET /api/attendance/myattendance
// @access  Private (Student)
const getStudentAttendance = asyncHandler(async (req, res) => {
  // Find all attendance records for the logged-in student
  const attendance = await Attendance.find({ student: req.user._id })
    .populate('class', 'subject grade') // Get class details
    .populate('teacher', 'name') // Get teacher's name
    .sort({ classDate: -1 }); // Show newest records first

  res.status(200).json(attendance);
});

export { markAttendance, getStudentAttendance, getClassAttendance };
