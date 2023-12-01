import express from 'express';
import tournament from './api/tournament.js';
import players from './api/players.js';
import seasons from './api/seasons.js';
import authenticate from './api/authenticate.js';
import verifyAccess from './middlewares/verifyAccess.js';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;
const app = express();

app.use(express.static('public'));

app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(express.json()); // parse application/json

// post requests require access token
app.post('/api/tournament', verifyAccess, (req, res) => {
  tournament(req, res);
});

app.post('/api/players', verifyAccess, (req, res) => {
  players(req, res);
});

app.post('/api/seasons', verifyAccess, (req, res) => {
  seasons(req, res);
});

// no access token required for get requests
app.get('/api/tournament', (req, res) => {
  tournament(req, res);
});

app.get('/api/players', (req, res) => {
  players(req, res);
});

// login
app.post('/api/authenticate', (req, res) => {
  authenticate(req, res);
});

app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});


