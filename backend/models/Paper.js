import mongoose from 'mongoose';

const paperSchema = mongoose.Schema(
  {
    teacher: { // Link to the teacher
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Please add a paper title'],
    },
    description: { // Optional description
      type: String,
      default: '',
    },
    // --- FIELDS FOR CLOUDINARY UPLOAD ---
    paperUrl: { // Stores the secure URL from Cloudinary
      type: String,
      required: true,
    },
    cloudinaryPublicId: { // Stores the ID needed to delete from Cloudinary
      type: String,
      required: true,
    },
    // ---
    subject: { // Associate with a subject
      type: String,
      required: [true, 'Please add a subject'],
    },
    grade: { // Associate with a grade
      type: String,
      required: [true, 'Please add a grade level'],
    },
  },
  {
    timestamps: true,
  }
);

const Paper = mongoose.model('Paper', paperSchema);

export default Paper;
