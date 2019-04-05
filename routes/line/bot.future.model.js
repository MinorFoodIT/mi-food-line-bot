var {Timestamp} = require('mongodb');

const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const timeZone = require('mongoose-timezone');
var moment = require('moment');
var _ = require('lodash');

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

    getCount(){
        return this.countDocuments({},(err,result) =>{
            if(err){
                return Promise.reject(err);
            }
            return result;
        })
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
            .then((err,orders) => {
                if(err){
                    return Promise.reject(err);
                }
                if (orders) {
                    return Promise.resolve(orders);
                }
                //const err = new APIError('No such future order exists!', httpStatus.NOT_FOUND ,true);

            });
    },

    getBrand(brand){
        return this.find({brand:brand})
            .sort({ createdAt: -1 })
            .exec()
            .then((error,orders) => {
                if (orders) {
                    return orders;
                }
                const err = new APIError('No such future order exists!', httpStatus.NOT_FOUND ,true);
                return Promise.reject(err);
            })
    },

    getUnAlertedBetweenMinutesTime(minuteDueTime){
        //var begin = moment().add(timestart,'minutes')
        //var end = moment().add(timeend,'minutes').toArray()
        //return this.find({ dueDate: {'$gte':new Date(begin[0],begin[1],begin[2],begin[3],begin[4],begin[5]),
        //        '$lte': new Date(end[0],end[1],end[2],end[3],end[4],end[5]) } ,alerted: false })

        //var begin = moment().add(timestart,'minutes').utcOffset('+0700').format("YYYY-MM-DDTHH:mm:ss.SSSZ");
        //var end = moment().add(timeend,'minutes').utcOffset('+0700').format("YYYY-MM-DDTHH:mm:ss.SSSZ");
        return this.getCount()
            .then(count => {
                if(count > 0){
                    return this.find({ alerted: 'false' })
                        .exec()
                        .then( (error,doc) => { //nothing doc is undefined
                            console.log('then result '+doc)
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
                }else{
                    return Promise.resolve([])
                }
            }).catch(err => {
                console.log('count error result '+err)
                return Promise.resolve([])
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

FutureSchema.plugin(timeZone, { paths: ['dueDate', 'alertDate' ,'createdAt'] });
/**
 * @typedef Future
 */
module.exports = mongoose.model('Future', FutureSchema );