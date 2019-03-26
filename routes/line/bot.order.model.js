//const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');

/**
 * Order Schema
 */
const OrderSchema = new mongoose.Schema({
    mode: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    site: {
        type: String,
        required: true
    },
    orderFrom: {
        type: String
    },
    orderNumber: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        match: [/^[0-9][0-9]{9}$/, 'The value of path {PATH} ({VALUE}) is not a valid mobile number.']
    },
    storeCode:{
        type: String
    },
    userName: {
        type: String
    },
    transactionTime: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    items:[],
    subtotal: {
        type: String
    },
    payment: {
        type: String
    },
    status: {
        type: String
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
OrderSchema.method({
});

/**
 * Statics
 */
OrderSchema.statics = {
    /**
     * Get user
     * @param {ObjectId} id - The objectId of user.
     * @returns {Promise<User, APIError>}
     */
    get(id) {
        return this.findById(id)
            .exec()
            .then((order) => {
                if (order) {
                    return order;
                }
                const err = new APIError('No such order exists!', httpStatus.NOT_FOUND ,true);
                return Promise.reject(err);
            });
    },

    getOrderId(orderId,brand){
        return this.findOne({orderNumber:orderId,brand:brand})
            .exec()
            .then((order) => {
                if (order) {
                    return order;
                }
                const err = new APIError('No such order exists!', httpStatus.NOT_FOUND ,true);
                return Promise.reject(err);
            });
    },

    getStoreOrderId(orderId,brand,store){
        return this.findOne({orderNumber:orderId,brand:brand,storeCode:storeCode})
            .exec()
            .then((order) => {
                if (order) {
                    return order;
                }
                const err = new APIError('No such order exists!', httpStatus.NOT_FOUND ,true);
                return Promise.reject(err);
            });
    },

    /**
     * List orders in descending order of 'createdAt' timestamp.
     * @param {number} skip - Number of users to be skipped.
     * @param {number} limit - Limit number of users to be returned.
     * @returns {Promise<User[]>}
     */
    list({ skip = 0, limit = 50 } = {}) {
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
module.exports = mongoose.model('Order', OrderSchema);