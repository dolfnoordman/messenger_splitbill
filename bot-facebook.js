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

//var Botkit = require('botkit');
var Botkit = require('./lib/Botkit.js');
var os = require('os');
var commandLineArgs = require('command-line-args');
var database = require('./database_module.js');

var controller = Botkit.facebookbot({
  access_token: process.env.FB_ACCESS_TOKEN,
  verify_token: process.env.FB_VERIFY_TOKEN,
  receive_via_postback: true
});

var temp_attachment = {
        'type':'template',
        'payload':{
            'template_type':'generic',
            'elements':[]
            }
        };

var temp_quickreply = {
  "quick_replies": [
      {
          "content_type": "",
          "title": "",
          "payload": "",
      }
  ]
};

// controller.api.thread_settings.greeting('Hallo, ik ben SplitBot');
// controller.api.thread_settings.get_started('GET_STARTED');
// controller.api.thread_settings.menu([
//             {
//               "title":"Vind Bankautomaat",
//               "type":"postback",
//               "payload":"FIND_ATM"}
//             ]);

function buildGenericTemplate(watsonData) {
  console.log(watsonData.context);
  var fb_message = {}

  if (typeof watsonData.context.generic !== 'undefined') {
    fb_message.attachment = temp_attachment
    fb_message.attachment.payload.elements = watsonData.context.generic.elements
    console.log('print elements');
    console.log(fb_message.attachment.payload.elements);
  }
  if (typeof watsonData.context.quick_replies !== 'undefined') {
    fb_message.quick_replies = watsonData.context.quick_replies
  }
  if (typeof watsonData.context.shareRequest !== 'undefined') {
    var requestButton = buildPaymentRequestButton(watsonData)
    fb_message.attachment.payload.elements[0].buttons = requestButton
    delete watsonData.context.shareRequest
    fb_message.quick_replies = [
        {
          "title": "Kaart aanpassen",
          "payload": "Edit_card",
          "content_type": "text"
        },
        {
          "title": "Verder chatten",
          "payload": "true",
          "content_type": "text"
        }
      ]
  }

  console.log(fb_message);
  return fb_message
}

function buildQuickReplies(watsonData) {
  console.log(watsonData.context);
  var fb_message = {}

  if (typeof watsonData.output.text !== 'undefined') {
    fb_message.text = watsonData.output.text.join('\n');
  }
  fb_message.quick_replies = watsonData.context.quick_replies

  console.log(fb_message);
  return fb_message
}

// Create a button including the card which is shared to the user
function buildPaymentRequestButton(watsonData) {

  //write payment request to db
  var userID = watsonData.context.messengerID
  var amount = watsonData.context.request_amount
  var desc = watsonData.context.request_message
  database.setPaymentRequest(userID, amount, '', desc, function(err, data){
  })

  var ref = {}
  ref.IntentID = 'SettleUp'
  ref.payID = userID
  ref = encodeURIComponent(JSON.stringify(ref))
  console.log('ref');
  console.log(ref);

  var button = {}
  button.type = "web_url"
  button.url = "http://m.me/1398550450167709?ref=" + ref
  button.title = "Betaal je vriend 💸"

  var element = {}
  element.title = "Je moet aan " + watsonData.context.firstName + " " + watsonData.context.request_amount + "€ betalen"
  element.subtitle = "\"" + watsonData.context.request_message + "\""
  element.image_url = "https://messenger-splitbill.mybluemix.net/assets/shareCard.png"
  element.buttons = [button]

  var button_payment_request =
  [
    {
      "type": "element_share",
      "share_contents": {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "generic"
          }
        }
      }
    }
  ]

  button_payment_request[0].share_contents.attachment.payload.elements = [element]

  console.log(element);
  return button_payment_request
}

var bot = controller.spawn();

controller.hears('(.*)', 'message_received', function(bot, message) {
  console.log('start hears');
  console.log(message);
  if (typeof message.watsonData.context.generic !== 'undefined') {
    // IF GENERIC TEMPLATE: first build attachment and than send possible text
    console.log('start attachment context building')
    var fbreply = buildGenericTemplate(message.watsonData)
    delete message.watsonData.context.generic
    bot.reply(message, fbreply);
    var fbreply = {text: message.watsonData.output.text.join('\n')}
    bot.reply(message, fbreply);

  } else if (typeof message.watsonData.context.quick_replies !== 'undefined'){
    // IF QUICK REPLY, build text and quick reply together
    console.log('start quick replies context building');
    var fbreply = buildQuickReplies(message.watsonData);
    delete message.watsonData.context.quick_replies
    bot.reply(message, fbreply);

  } else {
    // IF JUST TEXT, text reply
    var fbreply = {text: message.watsonData.output.text.join('\n')}
    console.log(fbreply);
    bot.reply(message, fbreply);
    console.log('start text building');
  }
});

// Create function when referral hears Settle Up flowId
function CreateSettleUpReply(payID, message){
  console.log(payID);
  database.getUser(payID, function(err, data){
    database.getPaymentRequests(data[0].ID, function(err1, data1){
      console.log(data);

      console.log(data1);
      var firstName = data[0].FIRSTNAME
      var iban = data[0].IBAN
      var amount = data1[0].AMOUNT

      fbreply = "Hallo! Blijkbaar moet jij " + firstName + " nog " + amount + "€ terugbetalen. Hier heb je zijn IBAN:"
      bot.reply(message, fbreply);
      fbreply = iban
      bot.reply(message, fbreply);
    });
  })
}

// this is triggered when a user clicks the send-to-messenger plugin
controller.on('facebook_referral', function(bot, message) {
  console.log('incoming referral message: ' + message);
  var refference = message.referral.ref
  ref = JSON.parse(decodeURIComponent(refference))

  if (ref.IntentID = 'SettleUp') {
    var fbreply = CreateSettleUpReply(ref.payID, message)
  }
});

module.exports.controller = controller;
module.exports.bot = bot;
