const { Given, When, Then, Before } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app } = require('../../src/app');

Before(function () {
  this.query = null;
  this.type = null;
  this.response = null;
});

Given('tengo la consulta SQL {string}', function (query) {
  this.query = query;
});

Given('tengo la consulta MongoDB {string}', function (query) {
  this.query = query;
});

When('valido la consulta como {string}', async function (type) {
  this.response = await request(app)
    .post('/api/validate')
    .send({ query: this.query, type })
    .set('Content-Type', 'application/json');
});

When('consulto el endpoint de salud', async function () {
  this.response = await request(app).get('/health');
});

Then('el resultado debe ser valido', function () {
  assert.equal(this.response.body.valid, true);
});

Then('el resultado debe ser invalido', function () {
  assert.equal(this.response.body.valid, false);
});

Then('el mensaje de error debe contener {string}', function (fragment) {
  const error = this.response.body.errors[0];
  const text = `${error.message} ${error.suggestion || ''}`;
  assert.ok(text.includes(fragment), `esperaba "${fragment}" en "${text}"`);
});

Then('el servicio debe responder con estado {string}', function (status) {
  assert.equal(this.response.status, 200);
  assert.equal(this.response.body.status, status);
});
