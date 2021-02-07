//These are the functions that are going to be called back as route handlers
const Author = require('../models/author');
const Book = require('../models/book');
const async = require('async');
const { body, validationResult } = require('express-validator');

//To display a list of all Authors
exports.author_list = (req, res) => {
	Author.find()
		.sort([['family_name', 'ascending']])
		.exec((err, list_authors) => {
			if (err) return next(err);
			res.render('author_list', { title: 'Author List', author_list: list_authors });
		});
};

//To display a detail page for a specific Author
exports.author_detail = (req, res) => {

	async.parallel({
		author: (cb) => {
			Author.findById(req.params.id)
				.exec(cb);
		},
		authors_books: (cb) => {
			Book.find({ 'author': req.params.id }, 'title summary')
				.exec(cb);
		}
	}, (err, results) => {
		if (err) return next(err);
		if (results.author==null) {
			const err = new Error('Author not found');
			err.status = 404;
			return next(err);
		}
		res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.authors_books });
	});
};

//To display Author create form on GET
exports.author_create_get = (req, res) => {
	res.render('author_form', { title: 'Create Author' });
};

//To handle POST to Author create
exports.author_create_post = [

    // Validate and sanitise fields.
    body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').trim().isLength({ min: 1 }).escape().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('author_form', { title: 'Create Author', author: req.body, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid.

            // Create an Author object with escaped and trimmed data.
            var author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                });
            author.save(function (err) {
                if (err) { return next(err); }
                // Successful - redirect to new author record.
                res.redirect(author.url);
            });
        }
    }
];

//To display Author delete form on get
exports.author_delete_get = (req, res, next) => {
	async.parallel({
        author: (cb) => {
            Author.findById(req.params.id).exec(cb)
        },
        authors_books: (cb) => {
            Book.find({ 'author': req.params.id }).exec(cb)
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.author === null) res.redirect('/catalog/authors');
        res.render('author_delete', { 
            title: 'Delete Author', 
            author: results.author, 
            author_books: results.authors_books 
        });
    });
};

//To handle POST to Author delete
exports.author_delete_post = (req, res, next) => {
	async.parallel({
        author: (cb) => {
            Author.findById(req.body.authorid).exec(cb)
        },
        authors_books: (cb) => {
            Book.find({ 'author': req.body.authorid }).exec(cb)
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.authors_books.length > 0) {
            res.render('author_delete', {
                title: 'Delete Author',
                author: results.author,
                author_books: results.authors_books
            });
            return;
        } else {
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) return next(err);
                res.redirect('/catalog/authors');
            });
        }
    });
};

//To display Author update form on GET
exports.author_update_get = (req, res) => {
	res.send('NOT IMPLEMENTED: Author update GET');
};

//To handle POST to Author update
exports.author_update_post = (req, res) => {
	res.send('NOT IMPLEMENTED: Author update POST');
}



