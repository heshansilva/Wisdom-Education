import User from '../models/User.js';;
import jwt from 'jsonwebtoken';
// Middleware to protect routes
export const protect = async (req, res, next) => {
  let token;

  // The token is sent in the headers like this: "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1]; // Splits "Bearer <token>" into an array and gets the token part

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by the ID that was in the token
      // We attach this user object to the request object
      // We exclude the password when we fetch the user
      req.user = await User.findById(decoded.id).select('-password');

      // Call the next middleware or the actual route controller
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware for teacher-only routes
export const isTeacher = (req, res, next) => {
  // This middleware MUST run AFTER the 'protect' middleware.
  // This is because the 'protect' middleware adds the 'user' object to the request.
  if (req.user && req.user.role === 'teacher') {
    next(); // User is a teacher, proceed to the next function (the controller)
  } else {
    // 403 Forbidden is more appropriate than 401 Unauthorized here.
    // The server knows who the user is, but they don't have permission for this action.
    res.status(403).json({ message: 'Access denied. You must be a teacher.' });
  }
};

export default { protect, isTeacher };
