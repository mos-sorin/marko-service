'use strict';
delete require('http').OutgoingMessage.prototype.flush;

var restify = require('restify'),
    bunyan = require('bunyan'),
    marko = require('marko'),
    through = require('through');

function markoRenderer(req, res, next) {
  // store the stream output
  var outputFromStream = '';
  var stream = through(function write(data) {
          outputFromStream += data;
      });

  var outWStream = marko.createWriter(stream);
  outWStream.on('end', function() {
      res.json({result: outputFromStream});
      next();
  })
  .on('error', function(e) {
    res.json({result: {}});
    next();
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
}

var server = restify.createServer();
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());

// screw you client!
server.pre(function(req, res, next) {
  req.headers.accept = 'application/json';
  return next();
});

// audit
server.on('after', restify.auditLogger({
  log: bunyan.createLogger({
    name: 'audit',
    stream: process.stdout
  })
}));

server.post('/marko/render.json', markoRenderer);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
