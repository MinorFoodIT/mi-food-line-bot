//const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');

/**
 * Store Schema
 */
const StoreSchema = new mongoose.Schema({
    site: {
        type: String
    },
    groupId: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
StoreSchema.method({
});

/**
 * Statics
 */
StoreSchema.statics = {
    /**
     * List orders in descending store of 'createdAt' timestamp.
     * @param {number} skip - Number of users to be skipped.
     * @param {number} limit - Limit number of users to be returned.
     * @returns {Promise<User[]>}
     */
    list({ skip = 0, limit = 5000 } = {}) {
        return this.find()
            .sort({ createdAt: -1 })
            .skip(+skip)
            .limit(+limit)
            .exec();
    }
};

/**
 * @typedef Order
 */
module.exports = mongoose.model('Store', StoreSchema);