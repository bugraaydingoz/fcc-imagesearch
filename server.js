// init project
var express = require('express');
var rp = require('request-promise');
var MongoClient = require('mongodb').MongoClient;

var app = express();
app.use(express.static('public'));

var mongoUrl = "mongodb://bugra:bugra@ds159696.mlab.com:59696/image_search"
var apiUrl = "https://www.googleapis.com/customsearch/v1?key=AIzaSyAPl4wm9FxnEDjMzpeoVLqig_1PcL0CXVA&cx=004183201015946588204:c9ujj0ej6om&searchType=image&fileType=jpg&imgSize=xlarge&alt=json";
var query = "";
var num = 10;

app.get("/latest", function (request, response) {
  MongoClient.connect(mongoUrl, function (err, db) {
    if (err) throw err;

    db.collection("recent_searches").find({}, {_id: 0, term: 1, when: 1}).toArray(function (err, res) {
      response.send(res);
      db.close();
    });
  });
});

app.get("/:search", function (request, response) {
  query = request.params["search"];
  num = request.query["offset"];
  if (!Number(num)) {
    num = 10
  }

  var reqUrl = apiUrl + "&q=" + query + "&num=" + num;

  var options = {
    uri: reqUrl,
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true,
  }
  rp(options).then(function (body) {

    var results = body.items;
    var items = [];

    for (var i = 0; i < results.length; i++) {
      var item = {
        url: results[i].link,
        snippet: results[i].snippet,
        thumbnail: results[i].image.thumbnailLink,
        context: results[i].image.contextLink
      };

      items.push(item);
    }

    MongoClient.connect(mongoUrl, (err, db) => {
      if (err) throw err;

      db.collection("recent_searches").insertOne({
        term: query,
        when: Date()
      }, function (err, result) {
        if (err) throw err;
        db.close();
      });
    });

    response.send(items);
  });
});



app.get("/", function (request, response) {

  response.sendFile(__dirname + '/views/index.html');
});


var listener = app.listen(3000, function () {
  console.log('Your app is listening on port ' + 3000);
});