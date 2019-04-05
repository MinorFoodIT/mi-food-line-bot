//const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
var _ = require('lodash');
/**
 * Order Schema
 */
const OrderSchema = new mongoose.Schema({
    dueDate:{               //Promise datetime
        type: Date,
        default: Date.now
    },
    future:{                //True is future order
        type: Boolean,
        default: false
    },
    alertDate:{             //Assign two time for tomorrow and before duetime
        type: Date,
        default: Date.now
    },
    alerted:{              //For future order to alert
        type: Boolean,
        default: false
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
        return this.find({orderNumber:orderId,brand:brand})
            .sort({ alertDate: 1 })
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
            .sort({ createdAt: -1 })
            .exec()
            .then((order) => {
                if (order) {
                    return order;
                }
                const err = new APIError('No such order exists!', httpStatus.NOT_FOUND ,true);
                return Promise.reject(err);
            });
    },

    getFutureByBrand(brand){
        return this.find({brand:brand , alerted: false}) //future: true
            .sort({ createdAt: 1 })
            .exec()
            .then((orders) => {
                if (orders) {
                    return orders;
                }
                const err = new APIError('No such future order exists!', httpStatus.NOT_FOUND ,true);
                return Promise.reject(err);
            })
    },

    getUnAlertedBetweenMinutesTime(minuteDueTime){
        /* comment
        //var begin = moment().add(timestart,'minutes')
        //var end = moment().add(timeend,'minutes').toArray()
        //return this.find({ dueDate: {'$gte':new Date(begin[0],begin[1],begin[2],begin[3],begin[4],begin[5]),
        //        '$lte': new Date(end[0],end[1],end[2],end[3],end[4],end[5]) } ,alerted: false })

        //var begin = moment().add(timestart,'minutes').utcOffset('+0700').format("YYYY-MM-DDTHH:mm:ss.SSSZ");
        //var end = moment().add(timeend,'minutes').utcOffset('+0700').format("YYYY-MM-DDTHH:mm:ss.SSSZ");
        */
        return this.find({ alerted: 'false' })
            .exec()
            .then( (error,doc) => { //nothing doc is undefined
                var result = _.filter(doc,future => {
                    var now = moment()
                    var due = moment(future.dueDate)
                    var duration = moment.duration(due.diff(now));
                    if(duration.asMinutes() <= minuteDueTime){
                        return true
                    }else{
                        return false
                    }
                })
                if(result) {
                    return result
                }
                const err = new APIError('No such future order exists!', httpStatus.NOT_FOUND ,true);
                return Promise.reject(err);
            })
    },

    getCount(){
        return this.countDocuments({},(err,result) =>{
            if(err){
                return Promise.reject(err);
            }
            return result;
        })
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