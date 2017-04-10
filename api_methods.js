var http = require("https");

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var deg2rad = function (deg) { return deg * (Math.PI / 180); }
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
}

function getNearestBank(latitude,longitude, callback) {
  console.log('start get nearest')
  var origin = latitude + '%2C'+ longitude

  var options = {
    "method": "GET",
    "hostname": "maps.googleapis.com",
    "port": null,
    "path": "/maps/api/place/nearbysearch/json?types=bank&key=AIzaSyBEgnQ-aOQd_RW7wKIq_ukYX6tFgGQjBBs&rankby=distance",
    "headers": {
      "cache-control": "no-cache",
    }
  };

  options.path = options.path + '&location=' + origin

  var atms = []

  var req = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = JSON.parse(Buffer.concat(chunks));

      for (var i=0; i<5; i++) {
         console.log('start bankfound loop')
         // todo: include throw error when results does not contain 5 values
         bankfound = body.results[i]
         bank = {}
         bank.location = bankfound.geometry.location
         bank.name = bankfound.name
         bank.address = bankfound.vicinity
         var destination = bankfound.geometry.location.lat + ',' + bankfound.geometry.location.lng
        //  https://www.google.com/maps?saddr=50.4,4.3&daddr=50.5,4.3
         var tempurl = 'https://www.google.com/maps?saddr=' + origin + '&daddr=' + destination + '&dirflg=w'
         bank.url = tempurl
         bank.distance = getDistanceFromLatLonInKm(latitude, longitude, bankfound.geometry.location.lat, bankfound.geometry.location.lng)
         console.log(bank.distance);
         console.log('lat1lon1..');
         console.log(latitude, longitude, bankfound.geometry.location.lat, bankfound.geometry.location.lng);
         if (bank.distance < 1) {
           bank.distance = (Math.round(bank.distance*1000)).toString() + ' m'
         } else {
           bank.distance = (bank.distance).toString().substring(0,3) + ' km'
         }
         atms.push(bank)
         console.log('in for loop atms:');
        //  console.log(atms)
      }
      callback(atms);
    });
  });
  req.end();

  // console.log(atms);

}



module.exports.getNearestBank = getNearestBank;
