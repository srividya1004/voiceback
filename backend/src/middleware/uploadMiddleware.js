/**
 * VoiceBack Private Upload Middleware
 * Handles temporary file uploads for audio recordings using multer.
 * Files are stored privately in backend/temp_uploads and deleted after processing.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure private temp_uploads directory exists
const tempUploadDir = path.join(__dirname, '../../temp_uploads');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `voice-sample-${uniqueSuffix}${ext}`);
  },
});

// File filter for audio files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'audio/wav',
    'audio/x-wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/webm',
    'audio/ogg',
    'audio/m4a',
    'audio/mp4',
    'audio/aac',
    'application/octet-stream',
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed for voice cloning.'), false);
  }
};

const uploadVoiceSample = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
});

module.exports = uploadVoiceSample;
