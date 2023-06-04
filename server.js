import express from 'express';
import fetch from './api/fetch.js';

//import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();

app.use(express.static('public'));

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }))
app.use(express.json());

const port = 8000;
app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});

app.get('/api/fetch.js', (req, res) => {
  fetch(req, res);
});

app.post('/api/fetch.js', (req, res) => {
  console.log(req.body);
  fetch(req, res);
});
