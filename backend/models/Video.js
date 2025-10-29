import mongoose from 'mongoose';
const videoSchema = mongoose.Schema(
  {
    // Link to the teacher who uploaded the video
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // References the 'User' model
    },
    topic: {
      type: String,
      required: [true, 'Please add a video topic'],
    },
    subject: {
      type: String,
      required: [true, 'Please add a subject'],
    },
    grade: {
      type: String,
      required: [true, 'Please add a grade level'],
    },
    videoUrl: {
      type: String,
      required: [true, 'Please add a video URL'],
      // Basic validation for a URL (you might want a more robust one)
      match: [/^(http|https)?:?\/\/.*/, 'Please use a valid URL'],
    },
    // We could add views later if needed
    // views: { type: Number, default: 0 }
  },
  {
    timestamps: true,
  }
);

const Video = mongoose.model('Video', videoSchema);

export default Video;