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
      .then(res=>{
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

describe('Edit one post.', function(){
  it('Should edit one post.', function(){
    const updateData = {
      author: {
        firstName: 'Jamie',
        lastName: 'Albertson'
      },
      title:  'A Blog Post Goes Forth',
      content: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. And that is sufficient pseudo-Latin for one test.'
    };
    return BlogPost
      .findOne()
      .then(post=>{
        updateData.id = post.id;
        return chai.request(app)
          .put(`/posts/${post.id}`)
          .send(updateData);
      })
      .then(res=>{
        res.should.have.status(204);
        return BlogPost.findById(updateData.id);
      })
      .then(post=>{
        post.title.should.equal(updateData.title);
        post.author.firstName.should.equal(updateData.author.firstName);
        post.author.lastName.should.equal(updateData.author.lastName);
        post.content.should.equal(updateData.content);
      });
  });
});

describe('Create endpoint for post.', function(){
  it('Should create one post.', function(){
    const newPost = {
      author: {
        firstName: 'Jamie',
        lastName: 'Albertson'
      },
      title:  'A Blog Post Goes Forth',
      content: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. And that is sufficient pseudo-Latin for one test.'
    };

    return chai.request(app)
      .post('/posts')
      .send(newPost)
      .then(res=>{
        res.should.have.status(201);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.include.keys(
          'id', 'author', 'content', 'title', 'created');
        res.body.id.should.not.be.null;
        res.body.author.should.equal(`${newPost.author.firstName} ${newPost.author.lastName}`);
        res.body.content.should.equal(newPost.content);
        res.body.title.should.equal(newPost.title);
        return BlogPost.findById(res.body.id); 
      })
      .then(post=>{
        post.title.should.equal(newPost.title);
        post.author.firstName.should.equal(newPost.author.firstName);
        post.author.lastName.should.equal(newPost.author.lastName);
        post.content.should.equal(newPost.content);
      });
  });
});

describe('Delete one post.', function(){
  it('Should delete one post.', function(){
    let apiRes;
    return BlogPost
      .findOne()
      .then(res=>{
        apiRes=res;
        return chai.request(app).delete(`/posts/${apiRes.id}`);
      }).then(res=>{
        res.should.have.status(204);
        return BlogPost.findById(apiRes.id);
      })
      .then(res=>{
        should.not.exist(res);
      });
  });
});