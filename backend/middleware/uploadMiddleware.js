const multer = require('multer');
const path = require('path');
const File = require('../models/File');

// Use memory storage to avoid writing to read-only disk on environments like Vercel
const storage = multer.memoryStorage();

// Check file type
const fileFilter = (req, file, cb) => {
  const filetypes = /pdf|doc|docx|png|jpg|jpeg/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, PNG, JPG, or JPEG files are allowed!'), false);
  }
};

const multerInstance = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

const upload = {
  single: (fieldname) => {
    const originalMiddleware = multerInstance.single(fieldname);
    return (req, res, next) => {
      originalMiddleware(req, res, async (err) => {
        if (err) {
          return next(err);
        }
        
        // If a file was successfully uploaded to memory
        if (req.file) {
          try {
            const filename = `${req.file.fieldname}-${Date.now()}${path.extname(req.file.originalname)}`;
            
            // Save file data to MongoDB
            const fileDoc = new File({
              filename: filename,
              contentType: req.file.mimetype,
              data: req.file.buffer
            });
            await fileDoc.save();
            
            // Set the filename property so that downstream controllers can access it normally
            req.file.filename = filename;
          } catch (dbErr) {
            return next(dbErr);
          }
        }
        
        next();
      });
    };
  }
};

module.exports = upload;
