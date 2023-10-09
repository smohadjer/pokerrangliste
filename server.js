import express from 'express';
import tournament from './api/tournament.js';

//import cors from 'cors';
//import bodyParser from 'body-parser';

const app = express();

app.use(express.static('public'));

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }))
app.use(express.json());

const port = 8000;
app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});

app.all('/api/tournament.js', (req, res) => {
  tournament(req, res);
});
