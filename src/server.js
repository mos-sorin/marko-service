var http = require('http'),
    through = require('through'),
    marko = require('marko'),
    schema = require('./input-schema').Schema,
    validator = require('is-my-json-valid'),
    validate = validator(schema)
    ;

function processPost(request, response, callback) {
    var queryData = "";
    if(typeof callback !== 'function') return null;

    request.on('data', function(data) {
        queryData += data;
        if(queryData.length > 1e6) {
            queryData = "";
            response.writeHead(413, {'Content-Type': 'application/json'});
            response.end();
            // destroy the connection
            request.connection.destroy();
        }
    });

    request.on('end', function() {
      try{
        request.post = JSON.parse(queryData);

        if(!validate(request.post)) {
          response.writeHead(400, {'Content-Type': 'application/json'});
          response.write(JSON.stringify({errors: validate.errors}));
          response.end();
        } else {
          callback();
        }
      }catch(e){
        response.writeHead(400, {'Content-Type': 'application/json'});
        response.write(JSON.stringify({errors: [{message: "Invalid json body"}]}));
        response.end();

        return null;
      }
    });
}

var server = module.exports = http.createServer(function(request, response) {
  if (request.url === '/marko/render.json' && request.method == 'POST' && request.headers['content-type'] === 'application/json') {
    processPost(request, response, function() {
        // store the stream output
        var outputFromStream = '';
        var stream = through(function write(data) {
                outputFromStream += data;
            });

        var outWStream = marko.createWriter(stream);
        outWStream.on('end', function() {
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.write(JSON.stringify({result: outputFromStream}));
            response.end();
        })
        .on('error', function(e) {
          response.writeHead(400, {'Content-Type': 'application/json'});
          response.write(JSON.stringify({errors: [{message: "Failed to render"}]}));
          response.end();
        });

        // posted data
        var postData = request.post;
        // template
        var templateSrc = postData.template;
        // load template into marko
        var template = marko.load('./sample.marko', templateSrc, {writeToDisk: false, buffer: false});
        template.render(postData.fields, outWStream).end();
    });
  } else {
    response.writeHead(404, {'Content-Type': 'application/json'});
    response.write(JSON.stringify({errors: [{message: "Resource not found"}]}));
    response.end();
  }
});
