import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Please add a lesson title'],
    },
    description: {
      type: String,
      default: '',
    },
    lessonUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Please add a subject'],
    },
    grade: {
      type: String,
      required: [true, 'Please add a grade level'],
    },
  },
  {
    timestamps: true,
  }
);

const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;
