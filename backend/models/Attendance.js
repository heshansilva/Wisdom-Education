import mongoose from 'mongoose';

const attendanceSchema = mongoose.Schema(
  {
    // Link to the student
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // Link to the class
    class: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Class',
    },
    // Link to the teacher who marked attendance
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // The specific date of the class
    classDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Present', 'Absent', 'Late', 'Excused'], // Define possible statuses
      default: 'Present',
    },
    notes: { // Optional notes from the teacher
      type: String,
      default: '',
    },
  },
  {
    timestamps: true, // Records when this entry was created
    // Add a unique index to prevent duplicate entries
    // (one student can only have one status for one class on one day)
    indexes: [
      { unique: true, fields: ['student', 'class', 'classDate'] }
    ]
  }
);

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
