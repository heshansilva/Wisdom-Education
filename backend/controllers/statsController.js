import asyncHandler from 'express-async-handler';
import Class from '../models/Class.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Attendance from '../models/Attendance.js';
import mongoose from 'mongoose';

// Helper function to get month names
const getMonthName = (monthNum) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthNum - 1]; // monthNum is 1-12
};

// @desc    Get dashboard stats for a teacher
// @route   GET /api/stats/teacher
// @access  Private (Teacher)
const getTeacherStats = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;

  // 1. Get Active Classes & Total Students (Parallel)
  const [activeClassesCount, classes] = await Promise.all([
     Class.countDocuments({ teacher: teacherId }),
     Class.find({ teacher: teacherId }).select('students')
  ]);
  
  const studentSet = new Set();
  classes.forEach(cls => {
    cls.students.forEach(studentId => {
      studentSet.add(studentId.toString());
    });
  });
  const totalStudents = studentSet.size;

  // 2. Get Total Revenue
  const allPayments = await Payment.find({ teacher: teacherId });
  const totalRevenue = allPayments.reduce((acc, payment) => acc + payment.amount, 0);

  // --- NEW: Calculate Monthly Revenue for Line Chart ---
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Use MongoDB Aggregation Pipeline
  const monthlyRevenueData = await Payment.aggregate([
    {
      $match: {
        teacher: teacherId,
        createdAt: { $gte: sixMonthsAgo } // Filter payments in the last 6 months
      }
    },
    {
      $project: {
        amount: 1,
        // Extract year and month from createdAt timestamp
        year: { $year: "$createdAt" }, 
        month: { $month: "$createdAt" }
      }
    },
    {
      $group: {
        _id: { year: "$year", month: "$month" }, // Group by year-month
        totalRevenue: { $sum: "$amount" }       // Sum revenue for each group
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 } // Sort by date
    }
  ]);

  // Format the data for recharts
  const monthlyRevenueChart = monthlyRevenueData.map(item => ({
    name: `${getMonthName(item._id.month)} ${item._id.year.toString().slice(-2)}`, // e.g., "Nov 25"
    Revenue: item.totalRevenue, // "Revenue" must match the dataKey in the Line component
  }));
  // --- END NEW LOGIC ---

  res.status(200).json({
    activeClasses: activeClassesCount,
    totalStudents,
    totalRevenue,
    profileViews: 0, // Placeholder
    monthlyRevenue: monthlyRevenueChart, // <-- Send new data
  });
});

// @desc    Get dashboard stats for a student
// @route   GET /api/stats/student
// @access  Private (Student)
const getStudentStats = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // 1. Get Last Fee Paid Date
  const lastPayment = await Payment.findOne({ student: studentId })
    .sort({ paymentDate: -1 })
    .select('paymentDate');
  const lastFeePaid = lastPayment ? lastPayment.paymentDate : null;

  // 2. Calculate OVERALL Attendance Percentage
  const allAttendance = await Attendance.find({ student: studentId });
  const totalRecords = allAttendance.length;
  const presentRecords = allAttendance.filter(record => 
    record.status === 'Present' || record.status === 'Late'
  ).length;
  const attendancePercentage = totalRecords > 0 
    ? Math.round((presentRecords / totalRecords) * 100) 
    : 100;

  // 3. Get Enrolled Class Count
  const enrolledClassesCount = await Class.countDocuments({ students: studentId });

  // --- NEW: Calculate Student's Monthly Attendance for Bar Chart ---
  const monthlyAttendanceData = await Attendance.aggregate([
    {
      $match: {
        student: studentId,
        classDate: { $gte: sixMonthsAgo } // Use classDate, not createdAt
      }
    },
    {
      $project: {
        status: 1,
        year: { $year: "$classDate" },
        month: { $month: "$classDate" }
      }
    },
    {
      $group: {
        _id: { year: "$year", month: "$month" },
        totalPresent: { // Count if status is 'Present' or 'Late'
          $sum: {
            $cond: [ { $in: ["$status", ["Present", "Late"]] }, 1, 0 ]
          }
        },
        totalRecords: { $sum: 1 } // Count total records
      }
    },
    {
      $project: {
        _id: 1,
        // Calculate percentage for the month
        percentage: {
          $round: [
            { $multiply: [ { $divide: ["$totalPresent", "$totalRecords"] }, 100 ] },
            0 // Round to 0 decimal places
          ]
        }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  // Format the data for recharts
  const monthlyAttendanceChart = monthlyAttendanceData.map(item => ({
    name: `${getMonthName(item._id.month)} ${item._id.year.toString().slice(-2)}`,
    Attendance: item.percentage, // "Attendance" must match the dataKey in the Bar
  }));
 

  res.status(200).json({
    lastFeePaid,
    attendancePercentage, // Overall percentage for the Stat Card
    enrolledClassesCount,
    monthlyAttendance: monthlyAttendanceChart, 
  });
});

export {
  getTeacherStats,
  getStudentStats
};

