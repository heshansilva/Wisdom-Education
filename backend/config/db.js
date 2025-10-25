import mongoose from 'mongoose';

// Define an asynchronous function to connect to the database
export const connectDB = async () => {
  try {
    // Attempt to connect to the MongoDB cluster using the connection string from the environment variables
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
   
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Export the connectDB function to be used in other parts of the application
export default connectDB;
