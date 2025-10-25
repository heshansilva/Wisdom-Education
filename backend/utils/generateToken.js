import jwt from 'jsonwebtoken';

// This function will generate a signed JWT
// It takes the user's ID as a payload
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // The token will be valid for 30 days
  });
};

export default generateToken;
