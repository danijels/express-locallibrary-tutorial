const Genre = require('../models/genre');
const Book = require('../models/book');

const async = require('async');
const { body, validationResult } = require('express-validator');

exports.genre_list = (req, res) => {
	Genre.find()
		.sort([['name', 'ascending']])
		.exec((err, list_genres) => {
			res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
		});
};

exports.genre_detail = (req, res) => {
	async.parallel({
		genre: (cb) => {
			Genre.findById(req.params.id)
				.exec(cb);
		},

		genre_books: (cb) => {
			Book.find({ 'genre': req.params.id })
				.exec(cb);
		}

	}, (err, results) => {
		if (err) return next(err);
		if (results.genre==null) {
			const err = new Error('Genre not found');
			err.status = 404;
			return next(err);
		}
		res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books })
	})
};

exports.genre_create_get = (req, res) => {
	res.render('genre_form', { title: 'Create Genre' });
};

exports.genre_create_post = [
	//This part validates and sanitizes 
	body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),
	//The request processing comes after validation and sanitization
	(req, res, next) => {
		//extract the validation results from a request.
		const errors = validationResult(req);

		const genre = new Genre({ name: req.body.name });

		if (!errors.isEmpty()) { //oops there are errors!
			res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array() });
			return;
		} else {
			Genre.findOne({ 'name': req.body.name }) //but wait, first check if sucha genre exists
				.exec((err, found_genre) => {
					if (err) return next(err);
					if (found_genre) //if it's a truthy, if it already exists we redirect the user to it
						res.redirect(found_genre.url);
					else { //it doesn't exist and there is no error so we save the new genre
						genre.save(err => {
							if (err) return next(err);
							res.redirect(genre.url);
						});
					}
				});
		}
	}

];

exports.genre_delete_get = (req, res, next) => {
	async.parallel({
		genre: (cb) => {
			Genre.findById(req.params.id).exec(cb)
		},
		genre_books: (cb) => {
			Book.find({ 'genre': req.params.id }).exec(cb)
		}
	}, (err, results) => {
		if (err) return next(err);
		if (results.genre===null) res.redirect('/catalog/genres');
		res.render('genre_delete', {
			title: 'Delete Genre',
			genre: results.genre,
			genre_books: results.genre_books
		});
	});
};

exports.genre_delete_post = (req, res, next) => {
	async.parallel({
		genre: (cb) => {
			Genre.findById(req.body.genreid).exec(cb)
		},
		genre_books: (cb) => {
			Book.find({ 'genre': req.body.genreid }).exec(cb)
		}
	}, (err, results) => {
		if (err) return next(err);
		if (results.genre_books.length > 0) {
			res.render('genre_delete', {
				title: 'Delete Genre',
				genre: results.genre,
				genre_books: results.genre_books
			});
			return;
		} else {
			Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
				if (err) return next(err);
				res.redirect('/catalog/genres')
			});
		}
	});
};

exports.genre_update_get = (req, res) => {
	res.send('NOT IMPLEMENTED: genre_update_get');
};

exports.genre_update_post = (req, res) => {
	res.send('NOT IMPLEMENTED: genre_update_post');
}