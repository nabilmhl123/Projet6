const Book = require('../models/Book');
const fs = require('fs');

exports.createBook = (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });

    book.save()
      .then(() => { 
        console.log('Book saved successfully');
        res.status(201).json({ message: 'Objet enregistré !' });
      })
      .catch(error => { 
        console.error('Error saving book: ', error);
        res.status(400).json({ error });
      });
  } catch (error) {
    console.error('Error parsing book object: ', error);
    res.status(400).json({ error: 'Invalid book data' });
  }
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => { 
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      res.status(200).json(book);
    })
    .catch(error => { 
      console.error('Error fetching book: ', error);
      res.status(404).json({ error });
    });
};

exports.modifyBook = (req, res, next) => {
  try {
    const bookObject = req.file ? {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };

    delete bookObject._userId;

    Book.findOne({ _id: req.params.id })
      .then((book) => {
        if (!book) {
          return res.status(404).json({ message: 'Book not found' });
        }
        if (book.userId != req.auth.userId) {
          return res.status(401).json({ message: 'Not authorized' });
        }
        Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet modifié!' }))
          .catch(error => res.status(400).json({ error }));
      })
      .catch((error) => {
        console.error('Error fetching book: ', error);
        res.status(400).json({ error });
      });
  } catch (error) {
    console.error('Error parsing book object: ', error);
    res.status(400).json({ error: 'Invalid book data' });
  }
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      if (book.userId != req.auth.userId) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      const filename = book.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Book.deleteOne({ _id: req.params.id })
          .then(() => { res.status(200).json({ message: 'Objet supprimé !' }); })
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => {
      console.error('Error deleting book: ', error);
      res.status(500).json({ error });
    });
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then(books => { res.status(200).json(books); })
    .catch(error => { 
      console.error('Error fetching books: ', error);
      res.status(400).json({ error }); 
    });
};

exports.bestRating = async (req, res) => {
  try {
    const books = await Book.find().sort({ averageRating: -1 }).limit(3);
    if (books.length === 0) {
      return res.status(404).json({ message: "No highly rated books found" });
    }
    res.status(200).json(books);
  } catch (error) {
    console.error('Error retrieving best rated books:', error);
    res.status(500).json({ message: 'Error retrieving best rated books' });
  }
};

exports.rateBook = async (req, res) => {
  const { id } = req.params;
  const { userId, rating } = req.body;

  try {
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }

    const existingRating = book.ratings.find(r => r.userId === userId);
    if (existingRating) {
      return res.status(400).json({ message: 'Vous avez déjà noté ce livre' });
    }

    book.ratings.push({ userId, grade: rating });
    book.averageRating = ((book.averageRating * book.ratings.length) + rating) / (book.ratings.length + 1);

    await book.save();
    res.status(200).json(book);
  } catch (error) {
    console.error('Error rating book:', error);
    res.status(500).json({ message: 'Erreur lors de la notation du livre', error });
  }
};