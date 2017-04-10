var ibmdb = require('ibm_db');

var db2;
var hasConnect = false;

if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);
	if (env['dashDB']) {
        hasConnect = true;
		db2 = env['dashDB'][0].credentials;
	}
}

if ( hasConnect == false ) {

   db2 = {
        db: "BLUDB",
        hostname: "dashdb-entry-yp-dal09-09.services.dal.bluemix.net",
        port: 50000,
        username: "dash6875",
        password: "I1w{2(xcWTCt"
     };
}

var connString = "DRIVER={DB2};DATABASE=" + db2.db + ";UID=" + db2.username + ";PWD=" + db2.password + ";HOSTNAME=" + db2.hostname + ";port=" + db2.port;

function postToUsersDatabase(messID, firstName, lastName, phone, iban, verified, callback) {
    var query = "INSERT INTO USERS (MESSENGERID, LASTNAME, FIRSTNAME, PHONE, IBAN, VERIFIED) VALUES ('"+ messID + "','" + firstName + "','" + lastName + "','" + phone + "','" + iban + "'," + verified +" );";
    console.log(query);
    queryDatabase(query, function(err, data) {
        callback(err, data);
    });
}

function postToLocationsDatabase(userID, lat, long, callback) {
    var query = "INSERT INTO LOCATIONS (USERID, TIMESTAMP, LAT, LONG) VALUES ('"+ userID + "', current timestamp,'" + lat + "','" + long +"' );";
    queryDatabase(query, function(err, data) {
        callback(err, data);
    });
}

function postToOTPDatabase(userID, otp, callback) {
    var query = "INSERT INTO OTP (USERID, TIMESTAMP, OTP) VALUES ('"+ userID + "', current timestamp,'" + otp + "' );";
    queryDatabase(query, function(err, data) {
        callback(err, data);
    });
}

function postToPaymentRequestsDatabase(userID, amount, type, desc, callback) {
    var query = "INSERT INTO PAYMENTREQUESTS (USERID, TIMESTAMP, AMOUNT, TYPE, DESC) VALUES ('"+ userID + "', current timestamp," + amount + ",'" + type + "','" + desc +"' );";
    queryDatabase(query, function(err, data) {
        callback(err, data);
    });
}

function postToPendingPaymentRequestsDatabase(paymentReqestID, paid, callback) {
    var query = "INSERT INTO PENDINGPAYMENTREQUESTS (PAYMENTREQUESTID, TIMESTAMP, PAID) VALUES ('"+ paymentReqestID + "',current timestamp," + paid +" );";
    queryDatabase(query, function(err, data) {
        callback(err, data);
    });
}

function selectUserFromUsersDatabase(messengerID, callback) {
    var query = "SELECT * FROM USERS WHERE MESSENGERID='" + messengerID + "';";
    queryDatabase(query, function(err, data) {
        callback(err, data);
    })
}

function selectLocationFromLocationsDatabase(userID, callback) {
    var query = "SELECT * FROM LOCATIONS WHERE USERID=" + userID + ";";
    console.log(query);
    queryDatabase(query, function(err, data) {
        callback(err, data);
    })
}

function selectOTPFromOTPDatabase(userID, callback) {
    var query = "SELECT * FROM OTP WHERE USERID=" + userID + ";";
    console.log(query);
    queryDatabase(query, function(err, data) {
        callback(err, data);
    })
}

function selectPaymentRequestFromPaymentRequestsDatabase(userID, callback) {
    var query = "SELECT * FROM PAYMENTREQUESTS WHERE USERID=" + userID + ";";
    console.log(query);
    queryDatabase(query, function(err, data) {
        callback(err, data);
    })
}

function selectPendingPaymentRequestFromPendingPaymentRequestsDatabase(userID, callback) {
    var query = "SELECT * FROM PAYMENTREQUESTS WHERE USERID=" + userID + ";";
    console.log(query);
    queryDatabase(query, function(err, data) {
        callback(err, data);
    })
}

function queryDatabase(queryString, callback) {
    ibmdb.open(connString, function(err, conn) {
        if(err) {
            callback(err, null);
        } else {
            conn.query(queryString, function(err, data) {
                if(!err) {
                    callback(null, data);
                } else {
                    callback(err, null);
                }
            })
        }
        conn.close();
    })
}

exports.setUser = postToUsersDatabase;
exports.setLocation = postToLocationsDatabase;
exports.setOTP = postToOTPDatabase;
exports.setPaymentRequest = postToPaymentRequestsDatabase;
exports.setPendingPaymentRequest = postToPendingPaymentRequestsDatabase;
exports.getUser = selectUserFromUsersDatabase;
exports.getLocation = selectLocationFromLocationsDatabase;
exports.getOTP = selectOTPFromOTPDatabase;
exports.getPaymentRequests = selectPaymentRequestFromPaymentRequestsDatabase;
exports.getPendingPaymentRequests = selectPendingPaymentRequestFromPendingPaymentRequestsDatabase;
