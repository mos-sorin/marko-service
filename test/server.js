var should = require('should'),
    supertest = require('supertest'),
    port = 8001,
    api = supertest('http://localhost:' + port),
    server = require('../src/server.js');

describe('The marko APIs', function () {
  before(function () {
    server.listen(port);
  });

  after(function () {
    server.close();
  });

  it('returns 404 if the Content-Type is not application/json', function(done) {
    api.post('/marko/render.json')
    .set('Content-Type', 'text/plain')
    .send("{}")
    .expect(404)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) return done(err);
      res.body.should.not.have.property('result');
      res.body.should.have.property('errors').with.lengthOf(1);
      res.body.should.have.property('errors').deepEqual([{message: 'Resource not found'}]);
      done();
    });
  });

  it('returns 400 if the body is not a valid json string', function(done) {
    api.post('/marko/render.json')
    .set('Content-Type', 'application/json')
    .send("{foobar'")
    .expect(400)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) return done(err);
      res.body.should.not.have.property('result');
      res.body.should.have.property('errors').with.lengthOf(1);
      res.body.should.have.property('errors').deepEqual([{message: 'Invalid json body'}]);
      done();
    });
  });

  it('returns 400 if both required params are not passed', function(done) {
    api.post('/marko/render.json')
    .set('Content-Type', 'application/json')
    .send("{}")
    .expect(400)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) return done(err);
      res.body.should.not.have.property('result');
      res.body.should.have.property('errors').with.lengthOf(2);
      res.body.should.have.property('errors').deepEqual([{ field: 'data.fields', message: 'is required' }, { field: 'data.template', message: 'is required' }]);
      done();
    });
  });

  it('returns 400 if the fields param is not passed', function(done) {
    api.post('/marko/render.json')
    .set('Content-Type', 'application/json')
    .send('{"template": "foobar"}')
    .expect(400)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) return done(err);
      res.body.should.not.have.property('result');
      res.body.should.have.property('errors').with.lengthOf(1);
      res.body.should.have.property('errors').deepEqual([{ field: 'data.fields', message: 'is required' }]);
      done();
    });
  });

  it('returns 400 if the fields param is not an object', function(done) {
    api.post('/marko/render.json')
    .set('Content-Type', 'application/json')
    .send('{"fields": "string", "template": "foobar"}')
    .expect(400)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) return done(err);
      res.body.should.not.have.property('result');
      res.body.should.have.property('errors').with.lengthOf(1);
      res.body.should.have.property('errors').deepEqual([{ field: 'data.fields', message: 'is the wrong type' }]);
      done();
    });
  });

  it('returns 400 if the fields param is an empty object', function(done) {
    api.post('/marko/render.json')
    .set('Content-Type', 'application/json')
    .send('{"fields": {}, "template": "foobar"}')
    .expect(400)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) return done(err);
      res.body.should.not.have.property('result');
      res.body.should.have.property('errors').with.lengthOf(1);
      res.body.should.have.property('errors').deepEqual([{ field: 'data.fields', message: 'has less properties than allowed' }]);
      done();
    });
  });

  it('returns 400 if the template param is not passed', function(done) {
    api.post('/marko/render.json')
    .set('Content-Type', 'application/json')
    .send('{"fields": {"name": "foobar"}}')
    .expect(400)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) return done(err);
      res.body.should.not.have.property('result');
      res.body.should.have.property('errors').with.lengthOf(1);
      res.body.should.have.property('errors').deepEqual([{ field: 'data.template', message: 'is required' }]);
      done();
    });
  });

  it('returns 400 if the template param is not a string', function(done) {
    api.post('/marko/render.json')
    .set('Content-Type', 'application/json')
    .send('{"fields": {"name": "foobar"}, "template": 111}')
    .expect(400)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) return done(err);
      res.body.should.not.have.property('result');
      res.body.should.have.property('errors').with.lengthOf(1);
      res.body.should.have.property('errors').deepEqual([{ field: 'data.template', message: 'is the wrong type' }]);
      done();
    });
  });

  it('returns 200 if both fields and template params are valid', function(done) {
    api.post('/marko/render.json')
    .set('Content-Type', 'application/json')
    .send('{"fields": {"name": "foobar"}, "template": "hello ${data.name}!"}')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) return done(err);
      res.body.should.not.have.property('errors');
      res.body.should.have.property('result').equal('hello foobar!');
      done();
    });
  });

  it('handles utf-8 text', function(done) {
    api.post('/marko/render.json')
    .set('Content-Type', 'application/json')
    .send('{"fields": {"name": "foobar 薝薢蟌 Grüße"}, "template": "hello ${data.name}!"}')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) return done(err);
      res.body.should.not.have.property('errors');
      res.body.should.have.property('result').equal('hello foobar 薝薢蟌 Grüße!');
      done();
    });
  });

  it('returns 404 if non-post method', function(done) {
    api.get('/marko/render.json')
    .set('Content-Type', 'application/json')
    .expect(404)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) return done(err);
      res.body.should.not.have.property('result');
      res.body.should.have.property('errors').deepEqual([{message: 'Resource not found'}]);
      done();
    });
  });
});
