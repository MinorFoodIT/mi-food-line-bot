const Order = require('./bot.order.model');
const fileHandler = require('./../helpers/FileHandler')
var logger = require('./../../config/winston')
var {middleware ,handlePreErr ,line_replyMessage ,line_pushMessage} = require('./../helpers/line.handler')
var joinmessage = require('../../config/flex/joinmessage');

function setGroupObj(req){
    groupObj = req.body.events[0].source
    groupObj.storeId = ''
    groupObj.storeName = ''
    return groupObj;

}

function checkPrefix(prefix){
    var found = msgText.match(prefix)
    return found;
}

/**
 * Line webhook ,action from line account
 * @param err
 * @param req
 * @param res
 * @param next
 */

function webhook(req,res){

    if(req.body.events[0].type == 'join'){
        groupId = req.body.events[0].source.groupId;
        groupObj = setGroupObj(req);
        //write to file name with source's groupID
        fileHandler.storeOutputFile(groupObj,groupId)

        //send reply message to let member setting siteId
        line_replyMessage(req.body.events[0].replyToken ,{ type: 'flex',altText:'Group Join', contents: joinmessage });

    }else if(req.body.events[0].type == 'leave'){
        groupId = req.body.events[0].source.groupId;
        groupObj = setGroupObj(req);
        fileHandler.removeStoreOutputFile(groupObj,groupId);
        //line_pushMessage(groupId ,{ type: 'flex',altText:'Leave', contents: leavemessage });

    }else if(req.body.events[0].type == 'message'){
        if( req.body.events[0].message.type == 'text') {
            groupId = req.body.events[0].source.groupId
            groupObj = setGroupObj(req);

            msgText = req.body.events[0].message.text

            if(checkPrefix('^(store=|site=)')){
                msgText = msgText.replace('store=','')
                groupObj.storeId = msgText
                //write to file name with source's groupID
                fileHandler.storeOutputFile(groupObj,groupId)
            }else if(checkPrefix('^(name=)')){
                msgText = msgText.replace('name=','')
                //to do : load old object
                groupObj.storeName = msgText
                fileHandler.storeOutputFile(groupObj,groupId)
            }
        }
    }
    //next(req,res)
    res.json(req.body.events) // req.body will be webhook event object
}

module.exports = { webhook ,middleware ,handlePreErr};