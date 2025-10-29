import mongoose from 'mongoose';

const teacherProfileSchema = mongoose.Schema(
  {
    // Link to the main User model (one-to-one relationship)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      unique: true, // Each user can only have one profile
    },
    profileTitle: {
      type: String,
      default: '',
    },
    publicContactNumber: {
      type: String,
      default: '',
    },
    publicEmailAddress: {
      type: String,
      default: '',
    },
    youtubeVideoUrl: {
      type: String,
      default: '',
    },
    // Social Media Links
    facebookUrl: { type: String, default: '' },
    youtubeChannelUrl: { type: String, default: '' },
    tiktokUrl: { type: String, default: '' },
    instagramUrl: { type: String, default: '' },
    // Profile Logo ( store the Cloudinary URL here later)
    profileLogoUrl: {
      type: String,
      default: '',
    },
    cloudinaryLogoPublicId: { // To allow deletion from Cloudinary
       type: String,
       default: ''
    }
  },
  {
    timestamps: true,
  }
);

const TeacherProfile = mongoose.model('TeacherProfile', teacherProfileSchema);

export default TeacherProfile; // Use ES Module export
