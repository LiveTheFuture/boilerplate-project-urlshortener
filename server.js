const dotenv = require('dotenv');
dotenv.config({path: 'sample.env'});
const express = require('express');
const cors = require('cors');
const shortid = require('shortid');
const validUrl = require('valid-url');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectId;
const mongoose = require('mongoose');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(express.urlencoded({extended: false}))

app.use(cors());
app.use(express.json());

//Connect to database
const uri = process.env.MONGO_URI;

mongoose.connect(uri, {
  dbName: 'Cluster0',
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const connection = mongoose.connection;

//connection.on('error', console.error.bind(console, 'connection error:'));

connection.once('open', () => {
  console.log('MONGODB database connection established successfully');
})

//Serve static files
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//Creating a Schema
let urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
});

let URL = mongoose.model('URL', urlSchema);


// Your first API endpoint
app.post('/api/shorturl/new', async function (req, res) {
  const url = req.body.url;
  const urlCode = shortid.generate();
  console.log(url)
  console.log(urlCode)
  //to check if the url is valid
  if(!validUrl.isWebUri(url)){
    res.status(401).json({
      error: 'invalid URL'
    })
  } else {
    try{
      //check if its already in the database
      let findOne = await URL.findOne({
        original_url: url
      })
      if (findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      } else {
        //create a new one if its not existing yet
        findOne = new URL({
          original_url: url,
          short_url: urlCode
        })
        await findOne.save()
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      }
    } catch (err) {
      console.error(err)
      res.status(500).json('Server error...')
    }
  }
})

app.get('/api/shorturl/:short_url?', async function(req, res){
  try{
    const urlParams = await URL.findOne({
      short_url: req.params.short_url
    })
    if(urlParams){
      return res.redirect(urlParams.original_url)
    } else {
      return res.status(404).json('No URL found')
    }
  } catch (err){
    console.log(err)
    res.status(500).json('Server error...')
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
