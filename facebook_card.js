
function shareIBAN(firstName, iban, image_url) {
    return {
      "recipient":{
        "id":"USER_ID"
      },
      "message":{
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"generic",
            "elements":[
              {
                "title":"Rekeningnummer van " + firstName,
                "subtitle": iban,
                "image_url": image_url,
                "buttons": [
                  {
                    "type": "element_share",
                    "share_contents": {
                      "attachment": {
                        "type": "template",
                        "payload": {
                          "template_type": "generic",
                          "elements": [
                            {
                              "title": "Rekeningnummer van " + firstName,
                              "subtitle": iban,
                              "image_url": image_url,
                              "default_action": {
                                "type": "web_url",
                                "url": "http://m.me/petershats?ref=invited_by_24601"
                              },
                              "buttons": [
                                {
                                  "type": "web_url",
                                  "url": "http://m.me/petershats?ref=invited_by_24601",
                                  "title": "Take Quiz"
                                }
                              ]
                            }
                          ]
                        }
                      }
                    }
                  }
                ]
              }
            ]
          }
        }
      }
    };
}

function sharePaymentRequest(firstName, amount, message, image_url) {
    return {
      "recipient":{
        "id":"USER_ID"
      },
      "message":{
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"generic",
            "elements":[
              {
                "title": "Je bent bent " + amount + " verschuldigd aan " + firstName,
                "subtitle": "Boodschap: " + message,
                "image_url": image_url,
                "buttons": [
                  {
                    "type": "element_share",
                    "share_contents": {
                      "attachment": {
                        "type": "template",
                        "payload": {
                          "template_type": "generic",
                          "elements": [
                            {
                              "title": "Je bent bent " + amount + " verschuldigd aan " + firstName,
                              "subtitle": "Boodschap: " + message,
                              "image_url": image_url,
                              "default_action": {
                                "type": "web_url",
                                "url": "http://m.me/petershats?ref=invited_by_24601"
                              },
                              "buttons": [
                                {
                                  "type": "web_url",
                                  "url": "http://m.me/petershats?ref=invited_by_24601",
                                  "title": "Take Quiz"
                                }
                              ]
                            }
                          ]
                        }
                      }
                    }
                  }
                ]
              }
            ]
          }
        }
      }
    };
}

exports.shareIBAN = shareIBAN
exports.sharePaymentRequest = sharePaymentRequest
