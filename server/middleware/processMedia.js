const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const processMedia = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    for (const file of req.files) {
      if (file.mimetype.startsWith('image/')) {
        const inputPath = file.path;
        const outputFilename = `${path.parse(file.filename).name}.webp`;
        const outputPath = path.join(path.dirname(inputPath), outputFilename);

        await sharp(inputPath)
          .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outputPath);

        // Delete original file and update req.file info
        await fs.unlink(inputPath);
        file.path = outputPath;
        file.filename = outputFilename;
        file.mimetype = 'image/webp';
      }
    }
    next();
  } catch (error) {
    console.error('Sharp processing error:', error);
    next(); // Continue even if processing fails
  }
};

module.exports = processMedia;
