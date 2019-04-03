const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const timeZone = require('mongoose-timezone');
var moment = require('moment');
/**
 * Future Schema
 */
const FutureSchema = new mongoose.Schema({
    dueDate:{
        type: Date,
        default: Date.now
    },
    alertDate:{
        type: Date,
        default: Date.now
    },
    alerted:{
        type: Boolean
    },
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
    discount: {
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
FutureSchema.method({
});

/**
 * Statics
 */
FutureSchema.statics = {
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
                const err = new APIError('No such future order exists!', httpStatus.NOT_FOUND ,true);
                return Promise.reject(err);
            });
    },

    getOrderId(orderId,brand){
        return this.find({orderNumber:orderId,brand:brand})
            .sort({ createdAt: -1 })
            .exec()
            .then((orders) => {
                if (orders) {
                    return orders;
                }
                const err = new APIError('No such future order exists!', httpStatus.NOT_FOUND ,true);
                return Promise.reject(err);
            });
    },

    getStoreId(brand,store){
        return this.find({brand:brand,storeCode:storeCode})
            .sort({ createdAt: -1 })
            .exec()
            .then((orders) => {
                if (orders) {
                    return orders;
                }
                const err = new APIError('No such future order exists!', httpStatus.NOT_FOUND ,true);
                return Promise.reject(err);
            });
    },

    getBrand(brand){
        return this.find({brand:brand})
            .sort({ createdAt: -1 })
            .exec()
            .then(async (orders) => {
                if (orders) {
                    /*
                    for(var i=0; i< orders.length;i++){
                        var date1Format = moment(orders[i].alertDate)
                        console.log(date1Format.tz('Asia/Bangkok').format())
                        orders[0].alertDate = date1Format.tz('Asia/Bangkok').format()
                        console.log(orders[0].alertDate)
                    }
                    console.log(orders[0].alertDate)
                    */
                    return orders;
                }
                const err = new APIError('No such future order exists!', httpStatus.NOT_FOUND ,true);
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

FutureSchema.plugin(timeZone, { paths: ['dueDate', 'alertDate' ,'createdAt'] });
/**
 * @typedef Future
 */
module.exports = mongoose.model('Future', FutureSchema);