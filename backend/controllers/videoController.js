import Video from '../models/Video.js';
import asyncHandler from 'express-async-handler';
// @desc    Get all videos for the logged-in teacher
// @route   GET /api/videos
// @access  Private (Teacher)
const getVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({ teacher: req.user._id }).sort({ createdAt: -1 }); // Sort newest first
  res.status(200).json(videos);
});

// @desc    Create a new video
// @route   POST /api/videos
// @access  Private (Teacher)
const createVideo = asyncHandler(async (req, res) => {
  const { topic, subject, grade, videoUrl } = req.body;

  if (!topic || !subject || !grade || !videoUrl) {
    res.status(400); // Bad Request
    throw new Error('Please add all required video fields');
  }

  const video = await Video.create({
    teacher: req.user._id, // Link to logged-in teacher
    topic,
    subject,
    grade,
    videoUrl,
  });

  res.status(201).json(video); // Respond with the created video
});

// @desc    Update a video
// @route   PUT /api/videos/:id
// @access  Private (Teacher)
const updateVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    res.status(404);
    throw new Error('Video not found');
  }

  // Check if the video belongs to the logged-in teacher
  if (video.teacher.toString() !== req.user._id.toString()) {
    res.status(403); // Forbidden
    throw new Error('User not authorized to update this video');
  }

  // Update fields (only update if they are provided in the request body)
  video.topic = req.body.topic || video.topic;
  video.subject = req.body.subject || video.subject;
  video.grade = req.body.grade || video.grade;
  video.videoUrl = req.body.videoUrl || video.videoUrl;

  const updatedVideo = await video.save();
  res.status(200).json(updatedVideo);
});

// @desc    Delete a video
// @route   DELETE /api/videos/:id
// @access  Private (Teacher)
const deleteVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    res.status(404);
    throw new Error('Video not found');
  }

  // Check if the video belongs to the logged-in teacher
  if (video.teacher.toString() !== req.user._id.toString()) {
    res.status(403); // Forbidden
    throw new Error('User not authorized to delete this video');
  }

  await Video.findByIdAndDelete(req.params.id);

  res.status(200).json({ id: req.params.id, message: 'Video deleted successfully' });
});

export { getVideos, createVideo, updateVideo, deleteVideo };
