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
};

/**
 * @typedef Order
 */
module.exports = mongoose.model('Store', StoreSchema);