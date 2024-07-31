const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const sharpConfig = require('../middleware/sharp-config');
const bookCtrl = require('../controllers/book');

router.get('/', bookCtrl.getAllBooks);
router.post('/', auth, multer, sharpConfig, bookCtrl.createBook);
router.get('/bestrating', bookCtrl.bestRating);
router.post('/:id/rating', auth, bookCtrl.rateBook);
router.put('/:id', auth, multer, sharpConfig, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);
router.get('/:id', bookCtrl.getOneBook);

module.exports = router;