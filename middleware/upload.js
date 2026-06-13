const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm',
    'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac',
    'application/octet-stream'
  ];

  if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    console.log('Blocked file type:', file.mimetype);
    cb(new Error('File type not allowed: ' + file.mimetype), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});

module.exports = upload;