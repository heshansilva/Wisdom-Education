import asyncHandler from 'express-async-handler';
import TeacherProfile from '../models/TeacherProfile.js'; // Import the Profile model
import cloudinary from '../config/cloudinary.js';         
import streamifier from 'streamifier';                  // Import streamifier helper

// @desc    Get the logged-in teacher's profile (or create if none exists)
// @route   GET /api/profile/teacher
// @access  Private (Teacher)
const getTeacherProfile = asyncHandler(async (req, res) => {
  let profile = await TeacherProfile.findOne({ user: req.user._id });

  if (!profile) {
    // If no profile exists, create a default one for this teacher
    profile = await TeacherProfile.create({ user: req.user._id });
  }
  res.status(200).json(profile);
});

// @desc    Update the logged-in teacher's profile (text fields only)
// @route   PUT /api/profile/teacher
// @access  Private (Teacher)
const updateTeacherProfile = asyncHandler(async (req, res) => {
  let profile = await TeacherProfile.findOne({ user: req.user._id });

  if (!profile) {
     console.log(`Profile not found for user ${req.user._id}, creating one.`);
     profile = await TeacherProfile.create({ user: req.user._id });
  }

  // Update fields from request body
  const {
    profileTitle, publicContactNumber, publicEmailAddress, youtubeVideoUrl,
    facebookUrl, youtubeChannelUrl, tiktokUrl, instagramUrl
  } = req.body;

  // Only update fields that are actually sent in the request
  if (profileTitle !== undefined) profile.profileTitle = profileTitle;
  if (publicContactNumber !== undefined) profile.publicContactNumber = publicContactNumber;
  if (publicEmailAddress !== undefined) profile.publicEmailAddress = publicEmailAddress;
  if (youtubeVideoUrl !== undefined) profile.youtubeVideoUrl = youtubeVideoUrl;
  if (facebookUrl !== undefined) profile.facebookUrl = facebookUrl;
  if (youtubeChannelUrl !== undefined) profile.youtubeChannelUrl = youtubeChannelUrl;
  if (tiktokUrl !== undefined) profile.tiktokUrl = tiktokUrl;
  if (instagramUrl !== undefined) profile.instagramUrl = instagramUrl;

  const updatedProfile = await profile.save();
  res.status(200).json(updatedProfile);
});

// @desc    Upload or update teacher profile logo
// @route   PUT /api/profile/teacher/logo
// @access  Private (Teacher)
const uploadProfileLogo = asyncHandler(async (req, res) => {
  // 1. Find the profile
  const profile = await TeacherProfile.findOne({ user: req.user._id });
  if (!profile) {
    res.status(404);
    throw new Error('Teacher profile not found.');
  }

  // 2. Check if a file was uploaded by Multer
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image file for the logo.');
  }
   if (!req.file.buffer || req.file.buffer.length === 0) {
     res.status(400);
     throw new Error('Uploaded image file is empty or corrupted');
  }

  // 3. Delete old logo from Cloudinary if it exists
  if (profile.cloudinaryLogoPublicId) {
    try {
      console.log(`Attempting to delete old logo: ${profile.cloudinaryLogoPublicId}`);
      // For images, resource_type defaults to 'image', no need to specify 'raw' explicitly
      await cloudinary.uploader.destroy(profile.cloudinaryLogoPublicId);
      console.log(`Successfully deleted old logo: ${profile.cloudinaryLogoPublicId}`);
    } catch (deleteError) {
      console.error(`Failed to delete old Cloudinary logo (${profile.cloudinaryLogoPublicId}):`, deleteError);
      // Log error but continue with upload
    }
  }

  // 4. Upload new logo buffer to Cloudinary
  let uploadResult;
  try {
    uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'profile_logos', // Store logos in a specific folder
          // Optional: Add transformations for consistent sizing
           transformation: [{ width: 300, height: 300, crop: "limit", quality: "auto" }]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Logo Upload Error:', error);
            return reject(new Error('Failed to upload profile logo'));
          }
          if (!result || !result.secure_url || !result.public_id) {
             console.error('Cloudinary Logo Upload Incomplete Result:', result);
             return reject(new Error('Cloudinary logo upload did not return necessary details.'));
          }
          resolve(result);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });
  } catch (uploadError) {
    console.error("Cloudinary logo upload failed:", uploadError);
    // Let the central error handler manage the response status code
    throw new Error(`Failed to upload logo image. ${uploadError.message}`);
  }

  // 5. Update profile document in DB with new Cloudinary info
  profile.profileLogoUrl = uploadResult.secure_url;
  profile.cloudinaryLogoPublicId = uploadResult.public_id;

  const updatedProfile = await profile.save();
  res.status(200).json(updatedProfile); // Send back the complete updated profile
});

// --- Use ES Module export ---
export { getTeacherProfile, updateTeacherProfile, uploadProfileLogo };

