'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const knex = require('../knex');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Static Server', function () {

  it('GET request "/" should return the index page', function () {
    return chai.request(app)
      .get('/')
      .then(function (res) {
        expect(res).to.exist;
        expect(res).to.have.status(200);
        expect(res).to.be.html;
      });
  });

});

describe('Noteful API', function () {
  
  const seedData = require('../db/seedData');

  beforeEach(function () {
    return seedData('./db/noteful.sql');
  });

  after(function () {
    return knex.destroy(); // destroy the connection
  });

  describe('GET /api/notes', function () {

    it('should return the default of 10 Notes ', function () {
      return chai.request(app)
        .get('/api/notes')
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(10);
        });
    });

    it('should return correct search results for a valid searchTerm', function () {
      return chai.request(app)
        .get('/api/notes?searchTerm=about%20cats')
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(4);
          expect(res.body[0]).to.be.an('object');
        });
    });

  });

  describe('404 handler', function () {

    it('should respond with 404 when given a bad path', function () {
      return chai.request(app)
        .get('/DOESNOTEXIST')
        .then(res=>{
          expect(res).to.have.status(404);
        });
    });
  
  });

  describe('GET /api/notes', function () {
  
    it('should return an array of objects where each item contains id, title, and content', function () {
      return chai.request(app)
        .get('/api/notes')
        .then(res=>{
          expect(res).to.have.status(200);
          expect(res).to.exist;
          expect(res.body).to.be.a('array');
          res.body.forEach(item=>{
            expect(item).to.be.a('object');
            expect(item).to.have.all.keys('id', 'title', 'content', 'folderId', 'folderName', 'tags');
          });
        });
    });
  
    it('should return an empty array for an incorrect searchTerm', function () {
      return chai.request(app)
        .get('/api/notes/?searchTerm=NOWAYTHISMATCHESANYTHING')
        .then(res=>{
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(0);
        });
    });
  
  });

  describe('GET /api/notes/:id', function () {

    it('should return correct note when given an id', function () {
      return chai.request(app)
        .get('/api/notes/1000')
        .then(res=>{
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.id).to.equal(1000);
          expect(res.body.title).to.equal('5 life lessons learned from cats');
        });
    });
  
    it('should respond with a 404 for an invalid id', function () {
      return chai.request(app)
        .get('/api/notes/677776')
        .then(function(res){
          expect(res).to.have.status(404);
        });
    });
  
  });
  
  describe('POST /api/notes', function () {
  
    it('should create and return a new item when provided valid data', function () {
      const newNote = {
        'title' : 'dogs > cats',
        'content' : 'everyone knows it is true'
      };
  
      return chai.request(app)
        .post('/api/notes')
        .send(newNote)
        .then(function(res){
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res).to.have.header('location');
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('title', 'content');
          expect(res.body.id).to.equal(1010);
          expect(res.body.title).to.equal(newNote.title);
          expect(res.body.content).to.equal(newNote.content);
        });
    });
  
    it('should return an error when missing "title" field', function () {
      
      const newNote = {
        'content' : 'this note does not have a title!'
      };
  
      return chai.request(app)
        .post('/api/notes')
        .send(newNote)
        .then(function(res){
          expect(res).to.have.status(400);
          expect(res.body.message).to.deep.equal('Missing `title` in request body');
        });
  
    });
  
  });
  
  describe('PUT /api/notes/:id', function () {
  
    it('should update the note', function () {
      const updateNote = {
        'title': 'Why are there  so many notes about cats?',
        'content': 'This app was written by an obsessed cat lady'
      };
      return chai.request(app)
        .put('/api/notes/1004')
        .send(updateNote)
        .then(function (res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'folderId', 'folderName', 'tags');
          expect(res.body.id).to.equal(1004);
          expect(res.body.title).to.equal(updateNote.title);
          expect(res.body.content).to.equal(updateNote.content);
        });
    });
  
    it('should respond with a 404 for an invalid id', function () {
      const updateNote = {
        'title': 'Why are there  so many notes about cats?',
        'content': 'This app was written by an obsessed cat lady'
      };
      return chai.request(app)
        .put('/api/notes/5555')
        .send(updateNote)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  
    it('should return an error when missing "title" field', function () {
  
      const updateNote = {
        'content' : 'this note does not have a title!'
      };
  
      return chai.request(app)
        .put('/api/notes/1003')
        .send(updateNote)
        .then(function(res){
          expect(res).to.have.status(400);
          expect(res.body.message).to.deep.equal('Missing `title` in request body');
        });
  
    });
  
  });
  
  describe('DELETE  /api/notes/:id', function () {
  
    it('should delete an item by id', function () {
      return chai.request(app)
        .delete('/api/notes/1008')
        .then(res =>{
          expect(res).to.have.status(204);
        });
    });
  
  });
  

});




