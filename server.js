import express from 'express';
import fetch from './api/fetch.js';
import register from './api/register.js';
import remove from './api/delete.js';
//import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();

app.use(express.static('public'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

const port = 8000;
app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});

app.get('/api/fetch.js', (req, res) => {
  fetch(req, res);
});

app.post('/api/register.js', (req, res) => {
  register(req, res);
});

app.post('/api/delete.js', (req, res) => {
  remove(req, res);
});
