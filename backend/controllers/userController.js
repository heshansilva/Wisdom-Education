import User from '../models/User.js';
import bcrypt from 'bcryptjs'; // For hashing passwords
import jwt from 'jsonwebtoken';


// Controller function to handle user registration

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  // Get name, email, and password from the request body
  const { name, email, password, role, phone } = req.body;

  try {
    // Check if a user with the same email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // Hash the password before saving it
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user in the database
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
    });

    // If the user was created successfully
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        message: 'User registered successfully',
      });

    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

  const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
      // Check if the user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Check if the password is correct
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate a JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
      });

      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token,
      });
    } catch (error) {
      res.status(500).json({ message: `Server Error: ${error.message}` });
    }
  };

  const getUserProfile = async (req, res) => {
  // We can access req.user here because the 'protect' middleware
  // found the user from the token and attached it to the request object.
  const user = req.user;

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Get all students (for teachers)
// @route   GET /api/users/students
// @access  Private (Teacher)
const getStudents = async (req, res) => {
  try {
    // Find all users with the role 'student'
    // .select('-password') excludes the password field from the result
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (error) {
    console.error(`Get Students Error: ${error.message}`); // Log error
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

export { registerUser, loginUser, getUserProfile, getStudents };