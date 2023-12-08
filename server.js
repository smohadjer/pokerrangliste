import express from 'express';
import cookieParser from 'cookie-parser';
import tournament from './api/tournament.js';
import players from './api/players.js';
import seasons from './api/seasons.js';
import authenticate from './api/authenticate.js';
import verifyAccess from './middlewares/verifyAccess.js';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;
const app = express();

app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(express.json()); // parse application/json

app.use(cookieParser());

// we put this route before using static since admin page is in public folder
// and express won't execute this route if it runs after express.static()  is run
app.get('/admin(.html)?', verifyAccess, (req, res, next) => {
  next();
});

app.use(express.static('public', {
  extensions: ['html', 'htm'],
}));

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

app.get('/api/seasons', (req, res) => {
  seasons(req, res);
});

// login
app.post('/api/authenticate', (req, res) => {
  authenticate(req, res);
});

app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});


