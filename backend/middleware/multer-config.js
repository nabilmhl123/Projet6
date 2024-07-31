const multer = require('multer');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

const storage = multer.memoryStorage(); // Utiliser memoryStorage pour travailler avec des buffers

const upload = multer({
  storage: storage,
  fileFilter: (req, file, callback) => {
    const extension = MIME_TYPES[file.mimetype];
    if (!extension) {
      return callback(new Error('Invalid file type'), false);
    }
    callback(null, true);
  }
});

module.exports = upload.single('image');