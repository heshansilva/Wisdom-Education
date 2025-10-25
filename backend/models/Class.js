import mongoose from "mongoose";

const classSchema = mongoose.Schema(
{
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // This creates a relationship between this Class and a User
    },
    subject: {
      type: String,
      required: [true, 'Please add a subject'],
    },
    grade: {
      type: String,
      required: [true, 'Please add a grade'],
    },
    area: {
      type: String,
    },
    time: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Class = mongoose.model("Class", classSchema);

export default Class;
