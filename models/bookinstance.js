const mongoose = require('mongoose');
const { Schema } = mongoose;
const { DateTime } = require('luxon');
//A specific copy of book that the library owns
const BookInstanceSchema = new Schema({
	book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
	imprint: { type: String, required: true },
	//enum array refers to the accepted values for this field
	status: { type: String, required: true, enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'], default: 'Maintenance'},
	due_back: { type: Date, default: Date.now } //NOTICE, Date.now i.e. a callback executed when constructing the doc AND NOT DATE.NOW() WHICH WOULD GET THE RIGHT NOW WHEN I'M WRITING THIS
});

BookInstanceSchema
.virtual('url')
.get(function () {
	return `/catalog/bookinstance/${this._id}`;
});

BookInstanceSchema
.virtual('due_back_formatted')
.get(function () {
	return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
});

module.exports = mongoose.model('BookInstance', BookInstanceSchema);