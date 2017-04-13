var request = require('request');
var database = require('./database_module.js')

const AUTH = 'Bearer 7cc720e71957bccb31808f2b4c8d5d37';
const CONTENTTYPE = 'application/json';
const MESSAGE = 'This is your one-time password @OTP@.\\n\\nThank you,\\nSplitbill team';

// Send OTP message for a user to
function sendTo(user_id, phoneNr, callback) {
    createOTP(function(otp) {
        addOTPtoOTPDatabase(user_id, otp, function(err) {
            if(!err) {
                sendOTPMessage(phoneNr, otp, function(err, res, body) {
                    if(!err) {
                        callback(null, otp);
                    } else {
                        callback(err, null);
                    }
                })
            } else {
                callback(err, null);
            }
        })
    })
}

// Check if OTP was correct,
function checkOTP(user_id, otp, callback) {
    database.getOTP(user_id, function(err, res) {
        if(!err) {
            callback(err, res[0].OTP == otp);
        } else {
            callback(err, null);
        }
    })
}

// Create a random OTP
function createOTP(callback) {
    var random = Math.floor(1000 + Math.random() * 9000);
    callback(random);
}

// Add an OTP to the database for a user_id
function addOTPtoOTPDatabase(user_id, otp, callback) {
    database.setOTP(user_id, otp, function(err, data) {
        if(!err) {
            callback(null)
        } else {
            callback(err);
        }
    })
}

// Sends SMS message to a given phoneNR with an OTP
function sendOTPMessage(phoneNr, otp, callback) {
    var headers = {
        'Authorization': AUTH,
        'Content-Type': CONTENTTYPE,
        'Accept': CONTENTTYPE
    };
    var messageWithOTP = MESSAGE.replace('@OTP@', otp);
    var dataString = '{"message":"' + messageWithOTP + '","destinations":["' + phoneNr + '"]}';

    var options = {
        url: 'https://api.enco.io/sms/1.0.0/sms/outboundmessages?forceCharacterLimit=false',
        method: 'POST',
        headers: headers,
        body: dataString
    };

    request(options, function(err, res, body) {
        console.log(options);
        callback(err, res, body);
    });
}

exports.sendTo = sendTo;
exports.check = checkOTP;
