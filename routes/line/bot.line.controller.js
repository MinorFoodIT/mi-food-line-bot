const Order = require('./bot.order.model');

const SignatureValidationFailed = require('@line/bot-sdk').SignatureValidationFailed;
const JSONParseError = require('@line/bot-sdk').JSONParseError;
const body_parser_1 = require("body-parser");
const fileHandler = require('./../helpers/FileHandler')



/**
 * Line check header signature
 */
function validateSignature(body, channelSecret, signature) {
    return safeCompare(crypto_1.createHmac("SHA256", channelSecret)
        .update(body)
        .digest(), s2b(signature, "base64"));
}


function middleware(config) {
    if (!config.channelSecret) {
        throw new Error("no channel secret");
    }
    const secret = config.channelSecret;
    return (req, res, next) => {
        // header names are lower-cased
        // https://nodejs.org/api/http.html#http_message_headers
        const signature = req.headers["x-line-signature"];
        if (!signature) {
            //next(new SignatureValidationFailed("no signature"));
            next(new Error("no signature"));
            return;
        }
        let getBody;
        if (isValidBody(req.rawBody)) {
            // rawBody is provided in Google Cloud Functions and others
            getBody = Promise.resolve(req.rawBody);
        }
        else if (isValidBody(req.body)) {
            getBody = Promise.resolve(req.body);
        }
        else {
            // body may not be parsed yet, parse it to a buffer
            getBody = new Promise(resolve => {
                body_parser_1.raw({ type: "*/*" })(req, res, () => resolve(req.body));
            });
        }
        getBody.then(body => {
            if (!validateSignature(body, secret, signature)) {
                //next(new SignatureValidationFailed("signature validation failed", signature));
                next(new Error("signature validation failed"));
                return;
            }
            const strBody = Buffer.isBuffer(body) ? body.toString() : body;
            try {
                req.body = JSON.parse(strBody);
                next();
            }
            catch (err) {
                next(new exceptions_1.JSONParseError(err.message, strBody));
            }
        });
    };
}


function handlePreErr(err, req, res, next) {
    if (err instanceof SignatureValidationFailed) {
        res.status(401).send(err.signature)
        return
    } else if (err instanceof JSONParseError) {
        res.status(400).send(err.raw)
        return
    }
    next()
    //next(err) // will throw default 500
}

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
 * Line webhook
 * @param err
 * @param req
 * @param res
 * @param next
 */

function webhook(req,res){
    if(req.body.events[0].type == 'join'){
        groupId = req.body.events[0].source.groupId
        groupObj = setGroupObj(req);
        //write to file name with source's groupID
        fileHandler.storeInputFile(groupObj,groupId)
    }

    if(req.body.events[0].type == 'message'){
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
    console.info('Inbound body ==>')
    console.info(req.body)


    if(req.body.events[0].source)
        console.info('source ==>')
        console.info(req.body.events[0].source)
    if(req.body.events[0].message)
        console.info('message ==>')
        console.info(req.body.events[0].message)
    //next(req,res)

    res.json(req.body.events) // req.body will be webhook event object
}

module.exports = { webhook ,middleware ,handlePreErr};