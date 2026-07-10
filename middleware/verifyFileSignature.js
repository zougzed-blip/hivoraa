
const ALLOWED_SIGNATURES = {
  image: ['jpg', 'png', 'webp', 'gif'],
  pdf: ['pdf'],
  audio: ['mp3', 'wav', 'webm', 'ogg', 'mp4', 'm4a', 'aac']
};

const verifyFileSignature = (categories) => {
  const allowedExts = categories.flatMap((cat) => ALLOWED_SIGNATURES[cat] || []);

  return async (req, res, next) => {
    try {
      const files = req.files
        ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
        : req.file
        ? [req.file]
        : [];

      if (files.length === 0) return next();

     
      const { fileTypeFromBuffer } = await import('file-type');

      for (const file of files) {
        const detected = await fileTypeFromBuffer(file.buffer);

        if (!detected) {
          return res.status(400).json({
            success: false,
            message: 'Could not verify file type. File may be corrupted or not a supported format.'
          });
        }

        if (!allowedExts.includes(detected.ext)) {
          return res.status(400).json({
            success: false,
            message: `File content does not match an allowed type (detected: ${detected.ext}).`
          });
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = verifyFileSignature;