import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import classRoutes from './routes/classRoutes.js';
import videoRoutes from './routes/videoRoutes.js'; 
import lessonRoutes from './routes/lessonRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import paperRoutes from './routes/paperRoutes.js';
import connectDB from './config/db.js';
import paymentRoutes from './routes/paymentRoutes.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Use the user routes for any requests to /api/users
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/payments', paymentRoutes);

// Define a simple route for the homepage
  app.get('/', (req, res) => {
    res.send('API is running...');
  });

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  connectDB();
});

