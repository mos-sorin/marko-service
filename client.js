var restify = require('restify');
var assert = require('assert');

var client = restify.createJsonClient({url: 'http://marko-evented.rhcloud.com', accept: 'application/json'});

var templateSrc = 'Hello ${data.name}! <ul if="notEmpty(data.colors)"> <li for="color in data.colors">${color}</li></ul><div else>No colors!</div>';
var postData = {}
postData.data = {}
postData.data.name = 'sorin';
postData.data.colors = ["a", "b", "c"]
postData.template = templateSrc;

for (var i = 0; i < 1000; i++) {
  client.post('/marko/render.json', postData, function(err, req, res, data) {
    assert.ifError(err);
    console.log('%d -> %j', res.statusCode, res.headers);
    console.log( data);
  });
}
