var config = require('./../../config/line.config');
var tag = require('./../../config/tag');
const body_parser_1 = require("body-parser");
const SignatureValidationFailed = require('@line/bot-sdk').SignatureValidationFailed;
const JSONParseError = require('@line/bot-sdk').JSONParseError;
const HTTPError = require('@line/bot-sdk').HTTPError;
const Client = require('@line/bot-sdk').Client;
const client = new Client(config);
var logger = require('./../../config/winston')(__filename)
const fileHandler = require('./../helpers/FileHandler')

const Order = require('./../line/bot.order.model');
const Future = require('./../line/bot.future.model');

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

/*{
"replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
"type": "join",
"timestamp": 1462629479859,
"source": {
"type": "group",
"groupId": "C4af4980629..."
}
}*/
function line_replyMessage(token ,contentMessage){
    client.replyMessage(token,contentMessage)
        .catch((err) => {
            if (err instanceof HTTPError) {
                logger.error(tag.line_reply_error+err.statusCode);
            }});
}

function line_pushMessage(orderType,orderSaved,token ,contentMessage){
        //logger.info(JSON.stringify(contentMessage))
    client.pushMessage(token,contentMessage)
        .then( () => {
            Order.findOneAndUpdate({_id: orderSaved._id}, {$set: {status: "LINE_SENT"}})
                .then().catch(err => logger.info(tag.line_push_error+err))
        })
        .catch((err) => {
            Order.findOneAndUpdate({_id: orderSaved._id}, {$set: {status: "LINE_FAIL"}})
                .then().catch(err => logger.info(tag.line_push_error+err))
            if (err instanceof HTTPError) {
                logger.error(err.statusCode);
            }
        });
}

function line_pushMessageFuture(orderType,orderSaved,token ,contentMessage){
        //logger.info(JSON.stringify(contentMessage))
    client.pushMessage(token,contentMessage)
        .then( () => {
            if(orderType == 1){
                Future.findOneAndUpdate({_id: orderSaved._id}, {$set: {status: "LINE_SENT",alerted: true }})
                    .then( async () => {
                        Future.find({_id: orderSaved._id}).deleteMany().exec()
                        //remove objectId from file
                        await fileHandler.removeFutureOutputFile(orderSaved, 'future')
                    }).catch(err => logger.info(tag.line_push_error+err))
            }
        })
        .catch((err) => {
            if (err instanceof HTTPError) {
                logger.error(err.statusCode);
            }

            if(orderType == 1){
                Future.findOneAndUpdate({_id: orderSaved._id}, {$set: {status: "LINE_FAIL",alerted: false }})
                    .then(
                        //remove objectId from file
                        //fileHandler.removeFutureOutputFile(orderSaved,'future')
                    ).catch(err => logger.info(tag.line_push_error+err))
            }
        });
}


module.exports = { middleware ,handlePreErr ,line_replyMessage ,line_pushMessage ,line_pushMessageFuture}