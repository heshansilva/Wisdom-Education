import asyncHandler from 'express-async-handler';
import Lesson from '../models/Lesson.js';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';
import Class from '../models/Class.js'; // <-- NEW: Import Class model

// --- Existing Functions (getLessons, createLesson, updateLesson, deleteLesson) ---
// @desc    Get all lessons for the logged-in teacher
// @route   GET /api/lessons
// @access  Private (Teacher)
const getLessons = asyncHandler(async (req, res) => {
  const lessons = await Lesson.find({ teacher: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(lessons);
});

// @desc    Create a new lesson with PDF upload
// @route   POST /api/lessons
// @access  Private (Teacher)
const createLesson = asyncHandler(async (req, res) => {
  const { title, description, subject, grade } = req.body;
  if (!req.file) { res.status(400); throw new Error('Please upload a PDF file'); }
  if (!req.file.buffer || req.file.buffer.length === 0) { res.status(400); throw new Error('Uploaded file is empty'); }
  if (!title || !subject || !grade) { res.status(400); throw new Error('Please add title, subject, and grade'); }

  let uploadResult;
  try {
    uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'lessons', resource_type: 'raw', format: 'pdf' },
        (error, result) => {
          if (error) { console.error('Cloudinary Upload Error:', error); return reject(new Error(`Failed to upload lesson file: ${error.message || 'Unknown error'}`)); }
          if (!result || !result.secure_url || !result.public_id) { console.error('Cloudinary Upload Incomplete Result:', result); return reject(new Error('Cloudinary upload did not return necessary details.'));}
          resolve(result);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });
  } catch (uploadError) {
      console.error("Cloudinary lesson upload failed:", uploadError);
      throw new Error(`Failed to upload lesson PDF. ${uploadError.message}`);
  }

  try {
     const lesson = await Lesson.create({
      teacher: req.user._id,
      title,
      description: description || '',
      subject,
      grade,
      lessonUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
    });
    res.status(201).json(lesson);
  } catch(dbError){
      console.error("Database save error after lesson upload:", dbError);
      try {
          await cloudinary.uploader.destroy(uploadResult.public_id, { resource_type: 'raw' });
          console.log("Orphaned Cloudinary lesson deleted:", uploadResult.public_id);
      } catch (cleanupError) {
          console.error("CRITICAL: Failed to delete orphaned Cloudinary lesson:", uploadResult.public_id, cleanupError);
      }
      throw new Error('Failed to save lesson details after upload.');
  }
});

// @desc    Update a lesson (Metadata only)
// @route   PUT /api/lessons/:id
// @access  Private (Teacher)
const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) { res.status(404); throw new Error('Lesson not found'); }
  if (!req.user || !req.user._id) { res.status(401); throw new Error('Not authorized');}
  if (lesson.teacher.toString() !== req.user._id.toString()) { res.status(403); throw new Error('User not authorized');}

  lesson.title = req.body.title || lesson.title;
  lesson.description = req.body.description !== undefined ? req.body.description : lesson.description;
  lesson.subject = req.body.subject || lesson.subject;
  lesson.grade = req.body.grade || lesson.grade;

  const updatedLesson = await lesson.save();
  res.status(200).json(updatedLesson);
});

// @desc    Delete a lesson
// @route   DELETE /api/lessons/:id
// @access  Private (Teacher)
const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) { res.status(404); throw new Error('Lesson not found'); }
  if (!req.user || !req.user._id) { res.status(401); throw new Error('Not authorized');}
  if (lesson.teacher.toString() !== req.user._id.toString()) { res.status(403); throw new Error('User not authorized');}

  let cloudinaryDeleted = false;
  try {
    const destroyResult = await cloudinary.uploader.destroy(lesson.cloudinaryPublicId, { resource_type: 'raw' });
    if (destroyResult.result === 'ok') { cloudinaryDeleted = true; }
    else { console.warn("Cloudinary deletion not 'ok':", destroyResult.result); }
  } catch (cloudinaryError) { console.error(`Cloudinary Delete Error (Lesson ${lesson.cloudinaryPublicId}):`, cloudinaryError); }

  await Lesson.findByIdAndDelete(req.params.id);

  res.status(200).json({
      id: req.params.id,
      message: `Lesson deleted.${!cloudinaryDeleted ? ' Cloudinary file may still exist.' : ''}`
  });
});

// --- UPDATED STUDENT FUNCTION ---
// @desc    Get all lessons accessible to students (filtered by enrolled class/grade)
// @route   GET /api/lessons/student
// @access  Private (Student/User)
const getStudentLessons = asyncHandler(async (req, res) => {
  // 1. Find all classes the student is enrolled in
  const studentClasses = await Class.find({ students: req.user._id }).select('subject grade');

  if (!studentClasses || studentClasses.length === 0) {
    return res.status(200).json([]); // Return empty array if not enrolled in any classes
  }

  // 2. Create a set of unique subject-grade pairs
  const criteria = [
    ...new Map(studentClasses.map(cls => 
      [`${cls.subject}|${cls.grade}`, { subject: cls.subject, grade: cls.grade }]
    )).values()
  ];

  if (criteria.length === 0) {
     return res.status(200).json([]); // Should not happen if studentClasses has items, but good practice
  }

  // 3. Find lessons that match any ($or) of these subject-grade pairs
  const lessons = await Lesson.find({ $or: criteria })
    .populate('teacher', 'name')
    .sort({ createdAt: -1 });
  
  res.status(200).json(lessons);
});
// --- END UPDATED FUNCTION ---

export {
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  getStudentLessons // <-- Export is the same
};

