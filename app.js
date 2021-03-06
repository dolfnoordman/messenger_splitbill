/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

require('dotenv').load();

var request = require('request')
var apimethods = require('./api_methods.js');
var database = require('./database_module.js');

var iban = require('./iban.js');
var otp = require('./OTP-module.js');

console.log(iban.isValid('helloWorld'));
console.log(iban.printFormat('be49063257519270', ' '));

// console.log('process env');
// console.log(process.env);

process.env.FB_APP_SECRET = 'b18f64ddb479f16c6151c25f0dd28874'
process.env.FB_ACCESS_TOKEN = 'EAALJ7SiOs5YBAHSZBZCRSBT3w7s535nzNmyGOhIQETZAeZCquxVbyhmjzn8nSzr80t0lXTMzz7HT7ZBgZCyICEamntDjIqHTbtiDIK3gZCsLc07b3IpadC5XKETIZCEyHjC1YKvBrt7ZAgHXuFCf1mVUZAY5AWFiUYQOtVZBZBe8BXqoOwZDZD'
process.env.FB_VERIFY_TOKEN = 'mySecretAccessToken'

//const SERVER_URL = (process.env.SERVER_URL) ?
  //(process.env.SERVER_URL) :
  //config.get('serverURL'); if not local
const SERVER_URL = "https://messenger-splitbill.mybluemix.net"

var middleware = require('botkit-middleware-watson')({
  username: process.env.CONVERSATION_USERNAME,
  password: process.env.CONVERSATION_PASSWORD,
  workspace_id: process.env.WORKSPACE_ID,
  version_date: '2016-09-20'
});

var temp_attachment = {
        'type':'template',
        'payload':{
            'template_type':'generic',
            'elements':[]
            }
        };

var temp_coordinate = {
            'lat':'',
            'long':''
        };

var temp_element = {
            'title':'...',
            'image_url':'https://maps.googleapis.com/maps/api/staticmap?size=764x400&center=50,4&zoom=10&markers=50,4',
            'subtitle':'',
            'buttons':[
                {
                  'type': 'web_url',
                  'url': 'http://maps.google.com/maps?saddr=new+york&daddr=baltimore',
                  'title': 'Go there 📍'
              }
            ]
          };

module.exports = function(app) {
  var Facebook = require('./bot-facebook');
  Facebook.controller.middleware.receive.use(middleware.receive);
  Facebook.controller.createWebhookEndpoints(app, Facebook.bot);
  console.log('Facebook bot is live');

  // Customize your Watson Middleware object's before and after callbacks.
  middleware.before = function(message, conversationPayload, callback) {
    console.log(message);
    console.log(conversationPayload);
    var customPayload = conversationPayload;
    var location_found = false;

    //Store fb messengerID in context when new session is started
    if (typeof customPayload.context == 'undefined') {
      customPayload.context = {}
      customPayload.context.messengerID = message.user
      console.log("customPayload_new_session");
      console.log(customPayload);
      callback(null, customPayload);
    } else if (typeof customPayload.context.validate_iban !== 'undefined') {
    //Check if message contains IBAN number when context.validate_iban
      customPayload.context.iban_isvalid = iban.isValid(message.text);
      console.log('is valid');
      if (customPayload.context.iban_isvalid) {
        var ibannr = iban.printFormat(message.text, ' ')
        customPayload.context.iban = ibannr
        console.log('setnew user with IBAN');
        console.log(ibannr);
        database.setUser(customPayload.context.messengerID,customPayload.context.firstName,customPayload.context.lastName,' ',ibannr,false, function(err, data) {
        });
      }
      delete customPayload.context.validate_iban;
      console.log("customPayload_validate_iban");
      console.log(customPayload);
      callback(null, customPayload);
    } else if (typeof customPayload.context.validate_phone !== 'undefined') {
      //Check if message contains valid phone number when context.validate_phone
        var phone = message.text
        var messID = customPayload.context.messengerID
        database.updatePhone(messID, phone, function(err,data){
          if (err) {
            console.log('error find in phone');
            customPayload.context.phone_isvalid = false
            delete customPayload.context.validate_phone;
            console.log("customPayload_validate_phone");
            console.log(customPayload);
            callback(null, customPayload);
          } else {
            console.log('phone is valid');
            customPayload.context.phone_isvalid = true
            customPayload.context.phone = phone
            delete customPayload.context.validate_phone;
            console.log("customPayload_validate_phone");
            console.log(customPayload);
            callback(null, customPayload);
          }
        })
    } else if (typeof message.attachments !== 'undefined') {
      // If coordinates are received from facebook, store these in the .context
      console.log("attachements found");
      var location = message.attachments[0];
      if (typeof location.payload.coordinates !== 'undefined') {
        console.log("coordinates found");
        location_found = true;
        var lat = location.payload.coordinates.lat;
        var long = location.payload.coordinates.long;
      }
      if (typeof conversationPayload !== 'undefined') {
        if (typeof conversationPayload.context !== 'undefined') {
          if (location_found) {
            customPayload.input.text = "location_sent";
            customPayload.context.coordinates = temp_coordinate;
            customPayload.context.coordinates.lat = lat;
            customPayload.context.coordinates.long = long;

            console.log("customPayload_coordinates");
            console.log(customPayload);
            callback(null, customPayload);
          }
        }
      }
    } else {    // end of storing coordinates in .context
      console.log("customPayload normal");
      console.log(customPayload);
      callback(null, customPayload);
    }
  }

  middleware.after = function(message, conversationResponse, callback) {

    console.log("conversationResponse");
    console.log(conversationResponse);

    //if find_atm is set as true within the watson.context, then find the nearest atms based on users location;
    //Coordinates should be given during previous interaction. (todo: include error/user reprompt check on coordinates indeed received)
    if (typeof conversationResponse.context.find_atm !== 'undefined') {
      // create template
      console.log('start of getNearestAtm appjs');
      apimethods.getNearestBank(conversationResponse.context.coordinates.lat, conversationResponse.context.coordinates.long, function(atms){
        console.log('return callback bank');
        console.log(atms);
        var locationArray = atms
        var fb_message = {};
        fb_message.attachment = JSON.parse(JSON.stringify(temp_attachment));
        var obj2 = JSON.parse(JSON.stringify(temp_attachment));
        for (var i = 0; i < locationArray.length; i++) {
          var fb_element = JSON.parse(JSON.stringify(temp_element));
          //var fb_element = temp_element;
          fb_element.title = locationArray[i].name + ' - ' + locationArray[i].address;
          fb_element.image_url = SERVER_URL + "/assets/bank.png";
          var knownbanks = ['kbc','ing','bnp','belfius']
          for (var banks in knownbanks) {
            if (locationArray[i].name.toLowerCase().includes(knownbanks[banks])) {
              fb_element.image_url = SERVER_URL + "/assets/" + knownbanks[banks] + ".png";
            }
          }

          fb_element.buttons[0].url = locationArray[i].url;
          fb_element.subtitle = locationArray[i].distance;
          fb_message.attachment.payload.elements.push(fb_element);
          console.log(fb_element);

        }

        console.log(fb_message);

        Facebook.bot.reply(message, fb_message);
        fb_element = null;

        delete conversationResponse.context.find_atm;
        console.log('print conversationResponse atm');
        console.log(conversationResponse);
        callback(null, conversationResponse);
      })
      // end of find nearest atms
      // ELSE if sentOTP is set
    } else if (typeof conversationResponse.context.sendOTP !== 'undefined') {
      otp.sendTo(conversationResponse.context.userID, conversationResponse.context.phone, function(err, data) {
        console.log('otp send');
        console.log(data);
        conversationResponse.context.otp = String(data)
        delete conversationResponse.context.sendOTP
        console.log('print conversationResponse otp');
        console.log(conversationResponse);
        callback(null, conversationResponse);
      });
    } else if (conversationResponse.context.system.dialog_turn_counter == 1) {
      console.log('build up session from user profile db')
      var messengerID = conversationResponse.context.messengerID
      database.getUser(messengerID, function(err, data) {
        console.log(data);
        if (data == '') { //If new user, get the user data from Facebook and create record in DB
// TODO: replace firstname lastname with call to User Profile API: https://developers.facebook.com/docs/messenger-platform/user-profile
          var firstName = 'test'
          var lastName = 'user'
          conversationResponse.context.firstName = firstName
          conversationResponse.context.lastName = lastName
          console.log('data is empty');
          database.setUser(messengerID,firstName,lastName,' ',' ',false, function(err, data) {
          });
          console.log('print conversationResponse new user');
          console.log(conversationResponse);
          callback(null, conversationResponse);
        } else { //update session context with data from DB
          console.log('session details retrieved from DB');
          data = data[0]
          conversationResponse.context.userID = data.ID
          conversationResponse.context.firstName = data.LASTNAME
          conversationResponse.context.lastName = data.FIRSTNAME
          conversationResponse.context.phone = data.PHONE
          conversationResponse.context.iban = data.IBAN
          conversationResponse.context.verified = data.VERIFIED
          console.log(conversationResponse.context);
          console.log('print conversationResponse existing user new session');
          console.log(conversationResponse);
          callback(null, conversationResponse);
        }
      });// end of initializing session
    } else { //Normal response
      console.log('print normal conversationResponse');
      console.log(conversationResponse);
      callback(null, conversationResponse);
    }
  }
};


function getUserInfoFromFacebook(user_id, callback) {
    var options = {
        url: 'https://graph.facebook.com/v2.6/' + user_id + '?fields=first_name,last_name,locale,timezone,gender&access_token=' + process.env.FB_ACCESS_TOKEN
    };

    request(options, function(error, response, body) {
        if(!error) {
            callback(null, body);
        } else {
            callback(err, null);
        }
    });
}
