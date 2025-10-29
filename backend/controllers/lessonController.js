import Lesson from '../models/Lesson.js';
import cloudinary from '../config/cloudinary.js';
import asyncHandler from 'express-async-handler';
import { Readable } from 'stream'; // Helper to upload buffer

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

  // 1. Check if file exists (Multer adds 'file' to req)
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a PDF file for the lesson');
  }
  // Check if buffer exists and has content
  if (!req.file.buffer || req.file.buffer.length === 0) {
     res.status(400);
     throw new Error('Uploaded file is empty or corrupted');
  }


  if (!title || !subject || !grade) {
    res.status(400);
    throw new Error('Please add title, subject, and grade');
  }

  // 2. Upload file buffer to Cloudinary
  let uploadResult;
  try {
    // Use a Promise to handle the stream upload
    uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'lessons', // Store in a 'lessons' folder in Cloudinary
          resource_type: 'raw', // Treat PDF as a raw file
          format: 'pdf', // Ensure Cloudinary knows it's a PDF
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            // Provide more specific error feedback if possible
            return reject(new Error(`Failed to upload lesson file to Cloudinary: ${error.message || 'Unknown error'}`));
          }
          if (!result || !result.secure_url || !result.public_id) {
             console.error('Cloudinary Upload Incomplete Result:', result);
             return reject(new Error('Cloudinary upload did not return necessary details (URL/Public ID).'));
          }
          resolve(result);
        }
      );
      // Pipe the file buffer from Multer into the Cloudinary upload stream
      Readable.from(req.file.buffer).pipe(uploadStream);
    });

  } catch (uploadError) {
     
      console.error("Cloudinary upload stream failed:", uploadError);
      throw new Error(`Failed to upload lesson PDF. ${uploadError.message}`);
  }


  // 3. Create Lesson in DB with Cloudinary URL and Public ID
  try {
     const lesson = await Lesson.create({
      teacher: req.user._id,
      title,
      description: description || '', 
      subject,
      grade,
      lessonUrl: uploadResult.secure_url, // Get URL from Cloudinary result
      cloudinaryPublicId: uploadResult.public_id, // Get Public ID
    });
    res.status(201).json(lesson);
  } catch(dbError){
     // If DB save fails, try to delete the already uploaded file from Cloudinary
      console.error("Database save error after Cloudinary upload:", dbError);
      try {
          // Specify resource_type for raw files when destroying
          await cloudinary.uploader.destroy(uploadResult.public_id, { resource_type: 'raw' });
          console.log("Orphaned Cloudinary file deleted:", uploadResult.public_id);
      } catch (cleanupError) {
         
          console.error("CRITICAL: Failed to delete orphaned Cloudinary file:", uploadResult.public_id, cleanupError);
      }
     
      throw new Error('Failed to save lesson details after successful file upload.');
  }

});

// @desc    Update a lesson (Metadata only, no file replacement for now)
// @route   PUT /api/lessons/:id
// @access  Private (Teacher)
const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    res.status(404); throw new Error('Lesson not found');
  }
  // Ensure req.user exists (from protect middleware)
  if (!req.user || !req.user._id) {
     res.status(401); // Unauthorized
     throw new Error('Not authorized, user data missing');
  }
  if (lesson.teacher.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('User not authorized to update this lesson');
  }

  // Update metadata fields safely
  lesson.title = req.body.title || lesson.title;
  // Handle description explicitly to allow setting it to empty string
  lesson.description = req.body.description !== undefined ? req.body.description : lesson.description;
  lesson.subject = req.body.subject || lesson.subject;
  lesson.grade = req.body.grade || lesson.grade;
  // We are NOT updating lessonUrl or cloudinaryPublicId here - file replacement needs a separate logic flow

  const updatedLesson = await lesson.save();
  res.status(200).json(updatedLesson);
});

// @desc    Delete a lesson (including file from Cloudinary)
// @route   DELETE /api/lessons/:id
// @access  Private (Teacher)
const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    res.status(404); throw new Error('Lesson not found');
  }
   // Ensure req.user exists (from protect middleware)
  if (!req.user || !req.user._id) {
     res.status(401); // Unauthorized
     throw new Error('Not authorized, user data missing');
  }
  if (lesson.teacher.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('User not authorized to delete this lesson');
  }

  // 1. Delete file from Cloudinary FIRST
  // Use a variable to track Cloudinary deletion status
  let cloudinaryDeleted = false;
  try {
     // Specify resource_type: 'raw' when destroying raw files like PDFs
    const destroyResult = await cloudinary.uploader.destroy(lesson.cloudinaryPublicId, { resource_type: 'raw' });
     // Check result from Cloudinary (e.g., destroyResult.result === 'ok')
     if (destroyResult.result === 'ok') {
        cloudinaryDeleted = true;
        console.log("Cloudinary file deleted:", lesson.cloudinaryPublicId);
     } else {
         console.warn("Cloudinary file deletion reported not 'ok':", destroyResult.result, "Public ID:", lesson.cloudinaryPublicId);
     }
  } catch (cloudinaryError) {
    // Log the error but proceed to delete from DB anyway, as the DB record is the primary source of truth
    console.error(`Cloudinary Delete Error for ${lesson.cloudinaryPublicId}:`, cloudinaryError);
    
  }

  // 2. Delete lesson from Database
  await Lesson.findByIdAndDelete(req.params.id);

  // Consider adjusting response based on Cloudinary success
  res.status(200).json({
      id: req.params.id,
      message: `Lesson deleted successfully.${!cloudinaryDeleted ? ' Cloudinary file may still exist.' : ''}`
  });
});

export { getLessons, createLesson, updateLesson, deleteLesson };


