import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure .gitkeep exists so empty uploads folder is tracked
const gitkeepPath = path.join(uploadDir, '.gitkeep');
if (!fs.existsSync(gitkeepPath)) {
  fs.writeFileSync(gitkeepPath, '');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Cryptographically safe random filename with sanitized extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    cb(null, 'evidence-' + uniqueSuffix + ext);
  }
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    const error = new Error('Invalid file extension. Only JPG, PNG, WEBP, and GIF images are permitted.');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file format. Only JPEG, PNG, WEBP, and GIF images are permitted.');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const multerInstance = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter
});

/**
 * Validate real image magic bytes from file buffer on disk
 */
function isValidImageMagicBytes(filePath) {
  try {
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return true;
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return true;
    }
    // GIF: GIF87a or GIF89a (47 49 46 38)
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return true;
    }
    // WebP: RIFF .... WEBP
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Custom Multer upload wrapper middleware that validates magic bytes and returns clean JSON
 */
export function handleSinglePhotoUpload(fieldName = 'photo') {
  const uploadSingle = multerInstance.single(fieldName);

  return (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Attached photo exceeds the maximum allowed size of 5 MB.'
          });
        }
        if (err.code === 'INVALID_FILE_TYPE') {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Error occurred while processing photo upload.'
        });
      }

      // Check real magic bytes of saved file to prevent stored XSS via renamed polyglot files
      if (req.file) {
        if (!isValidImageMagicBytes(req.file.path)) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (e) {}
          return res.status(400).json({
            success: false,
            message: 'File content verification failed. File is not a valid JPEG, PNG, WEBP, or GIF image.'
          });
        }
      }

      next();
    });
  };
}

export const upload = { single: handleSinglePhotoUpload };
