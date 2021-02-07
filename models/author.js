const mongoose = require('mongoose');
const { Schema } = mongoose;
const { DateTime } = require('luxon');
/*Notice how there isn't a field storing all of the authors stories. Copies of each story could be made, but that
would, surprisingly, mean having copies. Instead a search can be conducted on Book model for every book that this
author has written.*/
const AuthorSchema = new Schema({
	first_name: { type: String, maxlength: 100, required: true },
	family_name: { type: String, maxlength: 100, required: true },
	date_of_birth: Date,
	date_of_death: Date
});
/*Virtual properties are document properties that you can get and set but that do not get persisted to MongoDB. 
The getters are useful for formatting or combining fields, while setters are useful for de-composing a single value
into multiple values for storage.*/
/*The example here constructs a full name virtual property from family_name and first_name field, which is easier and
cleaner than constructing a full name every time one is used in a template.*/
//https://mongoosejs.com/docs/guide.html#virtuals
AuthorSchema
.virtual('name')
.get(function () {
	return `${this.family_name}, ${this.first_name}`;
});

AuthorSchema
.virtual('lifespan')
.get(function () {
	return (this.date_of_death.getYear() - this.date_of_birth.getYear()).toString();
});

AuthorSchema
.virtual('date_of_birth_formatted')
.get(function () {
	return this.date_of_birth 
	? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED) 
	: '';
});

AuthorSchema
.virtual('date_of_death_formatted')
.get(function () {
	return this.date_of_death
	? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED)
	: '';
});

AuthorSchema
.virtual('url')
.get(function () {
	return `/catalog/author/${this._id}`;
});
//The first argument to the mongoose.model method is THE NAME OF THE COLLECTION THAT WILL BE CREATED FOR THE MODEL
module.exports = mongoose.model('Author', AuthorSchema);