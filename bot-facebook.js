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

var temp_element = {
            'title':'...',
            'image_url':'',
            'subtitle':'',
            'buttons':[]
          };


function buildDomElement(watsonData) {
  console.log(watsonData.context);
  var fb_message = {}

  if (typeof watsonData.output.text !== 'undefined' && typeof watsonData.context.generic == 'undefined') {
    fb_message.text = watsonData.output.text.join('\n');
  }

  if (typeof watsonData.context.generic !== 'undefined') {
    fb_message.attachment = temp_attachment
    fb_message.attachment.payload.elements = watsonData.context.generic.elements
  }
  if (typeof watsonData.context.quick_replies !== 'undefined') {
    fb_message.quick_replies = watsonData.context.quick_replies
  }

  console.log(fb_message);
  return fb_message
}

var bot = controller.spawn();

controller.hears('(.*)', 'message_received', function(bot, message) {
  console.log('start hears');
  console.log(message);
  if (typeof message.watsonData.context.generic !== 'undefined') {
    console.log('start attachment context building')
    var fbreply = buildDomElement(message.watsonData)
    delete message.watsonData.context.generic
    bot.reply(message, fbreply);
    var fbreply = {text: message.watsonData.output.text.join('\n')}
    bot.reply(message, fbreply);

  } else if (typeof message.watsonData.context.quick_replies !== 'undefined'){
    console.log('start quick replies context building');
    var fbreply = buildDomElement(message.watsonData);
    delete message.watsonData.context.quick_replies
    bot.reply(message, fbreply);

  } else {
    var fbreply = {text: message.watsonData.output.text.join('\n')}
    console.log(fbreply);
    bot.reply(message, fbreply);
    console.log('start text building');
  }
});

module.exports.controller = controller;
module.exports.bot = bot;
