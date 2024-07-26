const Book = require('../models/Book');  // Le modèle doit être nommé 'Book'
const fs = require('fs');

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);  // Assurez-vous que req.body.book est une chaîne JSON
  delete bookObject._id;
  delete bookObject._userId;

  const book = new Book({  // Utilisez 'Book' et non 'Books' pour créer une instance du modèle
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });

  book.save()
  .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
  .catch(error => { res.status(400).json( { error })})
};
//ajoutez les changements
exports.getOneBook = (req, res, next) => {
  Book.findOne({  // Utilisez 'Book' et non 'Books' pour rechercher un document
    _id: req.params.id
  }).then(
    (book) => {
      res.status(200).json(book);  // Assurez-vous que la variable 'book' est utilisée ici
    }
  ).catch(
    (error) => {
      res.status(404).json({ error });
    }
  );
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file ? {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete bookObject._userId;

  Book.findOne({ _id: req.params.id })  // Utilisez 'Book' et non 'Books' pour rechercher un document
      .then((book) => {
          if (book.userId != req.auth.userId) {
              res.status(401).json({ message : 'Not authorized' });
          } else {
              Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })  // Utilisez 'Book' et non 'Books' pour mettre à jour un document
              .then(() => res.status(200).json({ message : 'Objet modifié!' }))
              .catch(error => res.status(401).json({ error }));
          }
      })
      .catch((error) => {
          res.status(400).json({ error });
      });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })  // Utilisez 'Book' et non 'Books' pour rechercher un document
      .then(book => {
          if (book.userId != req.auth.userId) {
              res.status(401).json({ message: 'Not authorized' });
          } else {
              const filename = book.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                  Book.deleteOne({ _id: req.params.id })  // Utilisez 'Book' et non 'Books' pour supprimer un document
                      .then(() => { res.status(200).json({ message: 'Objet supprimé !' }) })
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch(error => {
          res.status(500).json({ error });
      });
};

exports.getAllBooks = (req, res, next) => {
  Book.find().then(  // Utilisez 'Book' et non 'Books' pour rechercher des documents
    (books) => {
      res.status(200).json(books);
    }
  ).catch(
    (error) => {
      res.status(400).json({ error });
    }
  );
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
  const { id } = req.params; // ID du livre
  const { userId, rating } = req.body; // ID de l'utilisateur et sa note

  try {
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }

    // Vérifier si l'utilisateur a déjà noté le livre
    const existingRating = book.ratings.find(r => r.userId === userId);
    if (existingRating) {
      return res.status(400).json({ message: 'Vous avez déjà noté ce livre' });
    }

    // Ajouter la nouvelle note
    book.ratings.push({ userId, grade: rating });
    book.averageRating = ((book.averageRating * book.ratings.length) + rating) / (book.ratings.length + 1); // Mise à jour de la note moyenne

    await book.save();
    res.status(200).json(book);
  } catch (error) {
    console.error('Error rating book:', error);
    res.status(500).json({ message: 'Erreur lors de la notation du livre', error });
  }
};