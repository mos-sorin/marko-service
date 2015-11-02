var http = require('http'),
    marko = require('marko'),
    through = require('through');

function processPost(request, response, callback) {
    var queryData = "";
    if(typeof callback !== 'function') return null;

    if(request.method == 'POST') {
        request.on('data', function(data) {
            queryData += data;
            if(queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

        request.on('end', function() {
            request.post = JSON.parse(queryData);
            callback();
        });
    }
}

http.createServer(function(request, response) {
    if(request.method == 'POST') {
        processPost(request, response, function() {
            // store the stream output
            var outputFromStream = '';
            var stream = through(function write(data) {
                    outputFromStream += data;
                });

            var outWStream = marko.createWriter(stream);
            outWStream.on('end', function() {
                response.writeHead(200, "OK", {'Content-Type': 'application/json'});
                response.write(JSON.stringify({result: outputFromStream}))
                response.end();
            })
            .on('error', function(e) {
              response.writeHead(413, "OK", {'Content-Type': 'text/plain'});
              response.end();
            });

            // Use request.post here
            var templatePath = 'sample.marko';
            // posted data
            var postData = request.post
            // template
            var templateSrc = postData.template
            // load template into marko
            var template = marko.load(templatePath, templateSrc, {writeToDisk: false, buffer: false});
            var out = template.render(postData.data, outWStream).end();
        });
    } else {
        response.writeHead(413, "OK", {'Content-Type': 'text/plain'});
        response.end();
    }

}).listen(8000);
