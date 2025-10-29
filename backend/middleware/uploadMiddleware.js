import multer from 'multer';
import path from 'path';
// Configure Multer for memory storage (temporarily holds file in RAM)
// This is often sufficient for uploading to cloud services.
// For very large files, disk storage might be better.
const storage = multer.memoryStorage();

// File filter to accept only PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type, only PDF is allowed!'), false); // Reject file
  }
};

// Initialize Multer with storage and filter config
// '.single("lessonFile")' means we expect ONE file in the form field named "lessonFile"
const uploadPDF = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Optional: Limit file size (e.g., 10MB)
}).single('lessonFile'); // The field name in your form MUST match this

// Configuration for Image uploads (Profile Logo) ---
const imageStorage = multer.memoryStorage();
const imageFileFilter = (req, file, cb) => {
  // Accept common image types
  if (file.mimetype.startsWith('image/')) { // Check if mimetype starts with 'image/'
    cb(null, true);
  } else {
    cb(new Error('Invalid file type, only images are allowed!'), false);
  }
};
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for images
}).single('profileLogo'); // Expects field named 'profileLogo'

// --- Export both middleware ---
export { uploadPDF, uploadImage };