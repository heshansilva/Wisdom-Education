import Paper from '../models/Paper.js'; // Use Paper model
import cloudinary from '../config/cloudinary.js';
import asyncHandler from 'express-async-handler';
import streamifier from 'streamifier';

// @desc    Get all papers for the logged-in teacher
// @route   GET /api/papers
// @access  Private (Teacher)
const getPapers = asyncHandler(async (req, res) => {
  const papers = await Paper.find({ teacher: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(papers);
});

// @desc    Create a new paper with PDF upload
// @route   POST /api/papers
// @access  Private (Teacher)
const createPaper = asyncHandler(async (req, res) => {
  const { title, description, subject, grade } = req.body;

  if (!req.file) {
    res.status(400); throw new Error('Please upload a PDF file for the paper');
  }
   if (!req.file.buffer || req.file.buffer.length === 0) {
     res.status(400); throw new Error('Uploaded paper file is empty or corrupted');
  }
  if (!title || !subject || !grade) {
    res.status(400); throw new Error('Please add title, subject, and grade');
  }

  // Upload file buffer to Cloudinary
  let uploadResult;
  try {
    uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'papers', resource_type: 'raw', format: 'pdf' }, // Store in 'papers' folder
        (error, result) => {
          if (error) { console.error('Cloudinary Upload Error:', error); return reject(new Error(`Failed to upload paper file: ${error.message || 'Unknown error'}`)); }
          if (!result || !result.secure_url || !result.public_id) { console.error('Cloudinary Upload Incomplete Result:', result); return reject(new Error('Cloudinary upload did not return necessary details.'));}
          resolve(result);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });
  } catch (uploadError) {
      console.error("Cloudinary paper upload failed:", uploadError);
      throw new Error(`Failed to upload paper PDF. ${uploadError.message}`);
  }

  // Create Paper in DB
  try {
     const paper = await Paper.create({
      teacher: req.user._id,
      title,
      description: description || '',
      subject,
      grade,
      paperUrl: uploadResult.secure_url, // Use paperUrl field
      cloudinaryPublicId: uploadResult.public_id,
    });
    res.status(201).json(paper);
  } catch(dbError){
      console.error("Database save error after paper upload:", dbError);
      try { // Attempt cleanup
          await cloudinary.uploader.destroy(uploadResult.public_id, { resource_type: 'raw' });
          console.log("Orphaned Cloudinary paper deleted:", uploadResult.public_id);
      } catch (cleanupError) {
          console.error("CRITICAL: Failed to delete orphaned Cloudinary paper:", uploadResult.public_id, cleanupError);
      }
      throw new Error('Failed to save paper details after upload.');
  }
});

// @desc    Update paper metadata
// @route   PUT /api/papers/:id
// @access  Private (Teacher)
const updatePaper = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);

  if (!paper) { res.status(404); throw new Error('Paper not found'); }
  if (!req.user || !req.user._id) { res.status(401); throw new Error('Not authorized');}
  if (paper.teacher.toString() !== req.user._id.toString()) { res.status(403); throw new Error('User not authorized');}

  paper.title = req.body.title || paper.title;
  paper.description = req.body.description !== undefined ? req.body.description : paper.description;
  paper.subject = req.body.subject || paper.subject;
  paper.grade = req.body.grade || paper.grade;

  const updatedPaper = await paper.save();
  res.status(200).json(updatedPaper);
});

// @desc    Delete a paper (including file from Cloudinary)
// @route   DELETE /api/papers/:id
// @access  Private (Teacher)
const deletePaper = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);

  if (!paper) { res.status(404); throw new Error('Paper not found'); }
  if (!req.user || !req.user._id) { res.status(401); throw new Error('Not authorized');}
  if (paper.teacher.toString() !== req.user._id.toString()) { res.status(403); throw new Error('User not authorized');}

  // Delete from Cloudinary
  let cloudinaryDeleted = false;
  try {
    const destroyResult = await cloudinary.uploader.destroy(paper.cloudinaryPublicId, { resource_type: 'raw' });
    if (destroyResult.result === 'ok') { cloudinaryDeleted = true; console.log("Cloudinary paper deleted:", paper.cloudinaryPublicId); }
    else { console.warn("Cloudinary paper deletion not 'ok':", destroyResult.result, "ID:", paper.cloudinaryPublicId); }
  } catch (cloudinaryError) { console.error(`Cloudinary Delete Error (Paper ${paper.cloudinaryPublicId}):`, cloudinaryError); }

  // Delete from DB
  await Paper.findByIdAndDelete(req.params.id);

  res.status(200).json({
      id: req.params.id,
      message: `Paper deleted successfully.${!cloudinaryDeleted ? ' Cloudinary file may still exist.' : ''}`
  });
});

// @desc    Get papers accessible to the logged-in student
// @route   GET /api/papers/student
// @access  Private (Student)
const getStudentPapers = asyncHandler(async (req, res) => {
  // **Simplification:** For now, fetch ALL papers.
  // **Future Improvement:** Filter papers based on the student's enrolled classes, grade, or subjects.
  // This would require linking students to classes/subjects first.
  const papers = await Paper.find({}) // Fetch all papers for now
                            .sort({ createdAt: -1 })
                            .select('-cloudinaryPublicId -teacher'); // Exclude sensitive/internal info

  // **Alternative (More Complex):**
  // const student = await User.findById(req.user._id); // Assuming student details like grade are on User model
  // if (!student || !student.grade) {
  //   return res.json([]); // Or throw error
  // }
  // const papers = await Paper.find({ grade: student.grade }).sort(...);

  res.status(200).json(papers);
});

export { getPapers, createPaper, updatePaper, deletePaper, getStudentPapers };
