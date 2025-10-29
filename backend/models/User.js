import mongoose from 'mongoose';

// Define the schema for the User model
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Each email must be unique
    },
    password: {
      type: String,
      required: true,
    },

     phone: {
      type: String,
      required: false, // We'll make it optional for now
      default: '',
    },
    role: {
      type: String,
      required: true,
      enum: ['student', 'teacher'], // Role must be one of these values
      default: 'student',
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);


// Create the User model from the schema
const User = mongoose.model('User', userSchema);

export default User;
