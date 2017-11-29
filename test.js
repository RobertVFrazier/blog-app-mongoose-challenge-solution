'use strict';

const express = require('express');
const mongoose = require('mongoose');
const {DATABASE_URL, PORT} = require('./config');
const {BlogPost} = require('./models');
const app = express();
const mocha = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

