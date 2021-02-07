const mongoose = require('mongoose');
const { Schema } = mongoose;

const BookSchema = new Schema({
	title: { type: String, required: true },
	/*Here, the author field just holds the object id of another model of type 'Author' as specified in the ref field.
	Instead of having, say, 50 copies of the same Author for his 50 books, we instead store his object id as a 
	reference through which we can easily get to him*/
	//Likewise for genre, except the field holds an array of genre references.
	author: { type: Schema.Types.ObjectId, ref: 'Author', required: true },
	summary: { type: String, required: true },
	isbn: { type: String, required: true },
	genre: [{ type: Schema.Types.ObjectId, ref: 'Genre'}]
});

BookSchema
.virtual('url')
.get(function () {
	return `/catalog/book/${this._id}`;
});

module.exports = mongoose.model('Book', BookSchema);
