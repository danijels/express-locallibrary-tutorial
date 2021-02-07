const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');

const async = require('async');
const { body,validationResult } = require('express-validator');

exports.index = (req, res) => {
	async.parallel({
		book_count: (cb) => {
			Book.countDocuments({}, cb); //empty object so the method finds all docs
		},
		book_instance_count: (cb) => {
			BookInstance.countDocuments({}, cb);
		},
		book_instance_available_count: (cb) => {
			BookInstance.countDocuments({ status: 'available' }, cb);
		},
		author_count: (cb) => {
			Author.countDocuments({}, cb);
		},
		genre_count: (cb) => {
			Genre.countDocuments({}, cb);
		} //The following arg is a function that executes when all the ones up there are returned.
		//results are all the results that the functions passed to it
	}, (err, results) => { 
		//The following gets passed into index.pug i.e. a view named index. in our app.js we have pointed express where to look for views
		/*our template can access this data through these keys here. In this case, data is an object
		and to access say genre count, in the template you use data.genre_count where data is the
		key defined inside the object passed into the render method and .genre_count is the key 
		associated with the function that calculated the genre count*/
		res.render('index', { title: 'Local Library Home', error: err, data: results }); 
	});
};

exports.book_list = (req, res) => {
	Book.find({}, 'title author') //don't get me the entire doc with all the fields, just title and author please BUT IT DOES RETURN -ID AND VIRTUAL FIELDS
		//Remember how author is not the actual author obj, but his id through which he can be fetched
		//.populate method does this conversion and puts the author in his rightfull place
		.populate('author')
		.exec((err, list_books) => {
			if (err) return next(err);
			res.render('book_list', { title: 'Book List', book_list: list_books });
		});
};

exports.book_detail = (req, res) => {
	async.parallel({
		book: (cb) => {
			Book.findById(req.params.id)
				.populate('author')
				.populate('genre')
				.exec(cb);
		},
		book_instance: (cb) => {
			BookInstance.find({ 'book': req.params.id })
			.exec(cb);
		}
	}, (err, results) => {
		if (err) return next(err);
		if (results.book==null) {
			const err = new Error('Book not found');
			err.status = 404;
			return next(err);
		}
		res.render('book_detail', { title: results.book.title, book: results.book, book_instances: results.book_instance });
	});
};

exports.book_create_get = function(req, res, next) {

    // Get all authors and genres, which we can use for adding to our book.
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres });
    });
};

exports.book_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if(typeof req.body.genre ==='undefined')
            req.body.genre = [];
            else
            req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate and sanitise fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped and trimmed data.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if (err) { return next(err); }
                   //successful - redirect to new book record.
                   res.redirect(book.url);
                });
        }
    }
];

exports.book_delete_get = (req, res, next) => {
	async.parallel({
        book: (cb) => {
            Book.findById(req.params.id).exec(cb)
        },
        book_instances: (cb) => {
            BookInstance.find({ 'book': req.params.id }).exec(cb);
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.book === null) res.redirect('/catalog/books');
        res.render('book_delete', {
            title: 'Delete Book',
            book: results.book,
            book_instances: results.book_instances
        });
    });
};

exports.book_delete_post = (req, res, next) => {
	async.parallel({
        book: (cb) => {
            Book.findById(req.body.bookid).exec(cb)
        },
        book_instances: (cb) => {
            BookInstance.find({ 'book': req.body.bookid }).exec(cb)
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.book_instances.length > 0) {
            res.render('book_delete', {
                title: 'Delete Book',
                book: results.book,
                book_instances: results.book_instances
            });
            return;
        } else {
            Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) {
                if (err) return next(err);
                res.redirect('/catalog/books');
            });
        }
    });
};

exports.book_update_get = (req, res) => {
	
};

exports.book_update_post = (req, res) => {
	res.send('NOT IMPLEMENTED: book_update_post');
};