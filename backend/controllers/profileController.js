import asyncHandler from 'express-async-handler';
import TeacherProfile from '../models/TeacherProfile.js'; // Import the Profile model
import cloudinary from '../config/cloudinary.js';         // Import Cloudinary config
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

// @desc    Update the logged-in teacher's profile (metadata)
// @route   PUT /api/profile/teacher
// @access  Private (Teacher)
const updateTeacherProfile = asyncHandler(async (req, res) => {
  let profile = await TeacherProfile.findOne({ user: req.user._id });

  if (!profile) {
     console.log(`Profile not found for user ${req.user._id}, creating one.`);
     profile = await TeacherProfile.create({ user: req.user._id });
  }

  // Extract ALL fields from the body
  const {
    // Contact/Social
    profileTitle, publicContactNumber, publicEmailAddress, youtubeVideoUrl,
    facebookUrl, youtubeChannelUrl, tiktokUrl, instagramUrl,
    // NEW Homepage Content
    welcomeTitle, welcomeDescription, aboutMeContent
  } = req.body;

  // --- Update Contact/Social fields ---
  if (profileTitle !== undefined) profile.profileTitle = profileTitle;
  if (publicContactNumber !== undefined) profile.publicContactNumber = publicContactNumber;
  if (publicEmailAddress !== undefined) profile.publicEmailAddress = publicEmailAddress;
  if (youtubeVideoUrl !== undefined) profile.youtubeVideoUrl = youtubeVideoUrl;
  if (facebookUrl !== undefined) profile.facebookUrl = facebookUrl;
  if (youtubeChannelUrl !== undefined) profile.youtubeChannelUrl = youtubeChannelUrl;
  if (tiktokUrl !== undefined) profile.tiktokUrl = tiktokUrl;
  if (instagramUrl !== undefined) profile.instagramUrl = instagramUrl;

  // --- NEW: Update Homepage Content fields ---
  if (welcomeTitle !== undefined) profile.welcomeTitle = welcomeTitle;
  if (welcomeDescription !== undefined) profile.welcomeDescription = welcomeDescription;
  if (aboutMeContent !== undefined) profile.aboutMeContent = aboutMeContent;

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
      await cloudinary.uploader.destroy(profile.cloudinaryLogoPublicId);
      console.log(`Successfully deleted old logo: ${profile.cloudinaryLogoPublicId}`);
    } catch (deleteError) {
      console.error(`Failed to delete old Cloudinary logo (${profile.cloudinaryLogoPublicId}):`, deleteError);
    }
  }

  // 4. Upload new logo buffer to Cloudinary
  let uploadResult;
  try {
    uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'profile_logos',
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
    throw new Error(`Failed to upload logo image. ${uploadError.message}`);
  }

  // 5. Update profile document in DB
  profile.profileLogoUrl = uploadResult.secure_url;
  profile.cloudinaryLogoPublicId = uploadResult.public_id;

  const updatedProfile = await profile.save();
  res.status(200).json(updatedProfile);
});

// ---FUNCTION for Main Image Upload ---
// @desc    Upload or update teacher main image
// @route   PUT /api/profile/teacher/main-image
// @access  Private (Teacher)
const uploadMainImage = asyncHandler(async (req, res) => {
  const profile = await TeacherProfile.findOne({ user: req.user._id });
  if (!profile) { res.status(404); throw new Error('Teacher profile not found.'); }
  if (!req.file) { res.status(400); throw new Error('Please upload an image file.'); }
   if (!req.file.buffer || req.file.buffer.length === 0) {
     res.status(400); throw new Error('Uploaded image file is empty or corrupted');
  }

  // Delete old main image if it exists
  if (profile.cloudinaryMainImagePublicId) {
    try {
      console.log(`Attempting to delete old main image: ${profile.cloudinaryMainImagePublicId}`);
      await cloudinary.uploader.destroy(profile.cloudinaryMainImagePublicId);
      console.log(`Successfully deleted old main image: ${profile.cloudinaryMainImagePublicId}`);
    } catch (deleteError) {
      console.error(`Failed to delete old main image (${profile.cloudinaryMainImagePublicId}):`, deleteError);
    }
  }
  
  // Upload new main image
  let uploadResult;
  try {
    uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'main_images', // Store in a different folder
          transformation: [{ width: 1200, height: 600, crop: "limit", quality: "auto" }] 
        },
        (error, result) => {
          if (error) { console.error('Cloudinary Main Image Upload Error:', error); return reject(new Error('Failed to upload main image')); }
          if (!result || !result.secure_url || !result.public_id) { console.error('Cloudinary Main Image Upload Incomplete Result:', result); return reject(new Error('Cloudinary image upload did not return details.')); }
          resolve(result);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });
  } catch (uploadError) {
     console.error("Cloudinary main image upload failed:", uploadError);
    throw new Error(`Failed to upload main image. ${uploadError.message}`);
  }

  profile.mainImageUrl = uploadResult.secure_url;
  profile.cloudinaryMainImagePublicId = uploadResult.public_id;

  const updatedProfile = await profile.save();
  res.status(200).json(updatedProfile); // Send back the complete updated profile
});

const getPublicTeacherProfile = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400);
      throw new Error('Invalid User ID format');
  }

  // Find the profile and populate the user's name
  // We populate 'user' but only select the 'name' field for privacy
  const profile = await TeacherProfile.findOne({ user: userId })
                            .populate('user', 'name');

  if (!profile) {
    res.status(404);
    throw new Error('Teacher profile not found');
  }

  res.status(200).json(profile);
});

// --- Use ES Module export ---
export {
  getTeacherProfile,
  updateTeacherProfile,
  uploadProfileLogo,
  getPublicTeacherProfile,
  uploadMainImage 
};

