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
export { createClass, getClasses, deleteClass, updateClass };