'use strict';

const mongoose = require('mongoose');
const {TEST_DATABASE_URL, PORT} = require('./config');
const {BlogPost} = require('./models');
const {app, runServer, closeServer} = require('./server');
const seedData = require('./seed-data.json');
const mocha = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

function tearDownDb() {
  return new Promise((resolve, reject) => {
    console.warn('Deleting database');
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err));
  });
}

beforeEach(function(){
  return BlogPost.insertMany(seedData);
});

afterEach(function() {
  return tearDownDb();
});

before(function() {
  return runServer();
});

after(function() {
  return closeServer();
});

describe('Get all posts.', function(){
  it('Should get all posts.', function(){
    let apiRes;
    return chai.request(app)
      .get('/posts')
      .then((res)=>{
        apiRes=res;
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body.length.should.be.above(0);
        const myId=res.body[0].id;
        console.log(myId);
        return BlogPost.findById(myId);
      }).then((myBlogPost)=>{
        myBlogPost.title.should.equal(apiRes.body[0].title);
      }); 		
  });
});



describe('Delete one post.', function(){
  it('Should delete one post.', function(){
    let apiRes;
    return BlogPost
      .findOne()
      .then((res)=>{
        apiRes=res;
        return chai.request(app).delete(`/posts/${apiRes.id}`);
      }).then((res)=>{
        res.should.have.status(204);
        return BlogPost.findById(apiRes.id);
      })
      .then((res)=>{
        should.not.exist(res);
      });
  });
});