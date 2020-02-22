'use strict';

const mongoose = require('mongoose');

const TagSchema = mongoose.Schema({
    value: { type: String, unique: true }
});

TagSchema.statics.getTags = function() {
    const query = Tag.find({});
    query.select('value');
    return query.exec();
};

const Tag = mongoose.model('Tag', TagSchema);

module.exports = Tag;