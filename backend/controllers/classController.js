import Class from '../models/Class.js';

const createClass = async (req, res) => {
  try {
    // Get class details from the request body
    const { subject, grade, area, time, price } = req.body;

    // We get req.user from our 'protect' middleware
    const teacherId = req.user._id;

    // Check for required fields
    if (!subject || !grade || !area || !time) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    // Create a new class instance
    const newClass = new Class({
      teacher: teacherId,
      subject,
      grade,
      area,
      time,
      price: price || 0, // Default price to 0 if not provided
    });

    // Save the class to the database
    const savedClass = await newClass.save();

    res.status(201).json(savedClass);
  } catch (error) {
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

const deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const teacherId = req.user._id;

    const classToDelete = await Class.findById(classId);

    // Check if the class exists
    if (!classToDelete) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if the logged-in user is the teacher who created this class
    // We use .toString() because 'teacher' is an ObjectId
    if (classToDelete.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({ message: 'User not authorized to delete this class' });
    }

    // Find by ID and remove
    await Class.findByIdAndDelete(classId);

    res.status(200).json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

const updateClass = async (req, res) => {
  const { subject, grade, area, time, price } = req.body;
  const classId = req.params.id;
  const teacherId = req.user._id;

  try {
    let classToUpdate = await Class.findById(classId);

    // Check if the class exists
    if (!classToUpdate) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if the logged-in user is the teacher who created this class
    if (classToUpdate.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({ message: 'User not authorized to update this class' });
    }

    // Update the fields
    classToUpdate.subject = subject || classToUpdate.subject;
    classToUpdate.grade = grade || classToUpdate.grade;
    classToUpdate.area = area || classToUpdate.area;
    classToUpdate.time = time || classToUpdate.time;
    classToUpdate.price = price || classToUpdate.price;
    // (We're simple updating all fields. A more robust app might check which fields were sent)

    const updatedClass = await classToUpdate.save();

    res.status(200).json(updatedClass); // Send back the full updated class
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

const getClasses = async (req, res) => {
  try {
    // We get req.user from our 'protect' middleware
    const teacherId = req.user._id;

    // Find all classes created by this specific teacher
    const classes = await Class.find({ teacher: teacherId });
    
    // We sort it in memory to avoid index issues.
    // Sorting by creation date, newest first.
    const sortedClasses = classes.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json(sortedClasses);
  } catch (error) {
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

// ENROLLMENT FUNCTIONS (TEACHER) ---

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
  
  // Return the newly added student (after populating)
  await student.populate(); // Make sure we have student details
  res.status(201).json(student);
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


// ---FUNCTION (STUDENT) ---

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
  getStudentClasses // <-- Add new function
};
