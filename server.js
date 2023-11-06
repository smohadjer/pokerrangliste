import express from 'express';
import tournament from './api/tournament.js';
import authenticate from './api/authenticate.js';
import verifyAccess from './middlewares/verifyAccess.js';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;
const app = express();

app.use(express.static('public'));

app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(express.json()); // parse application/json

// requires access token
app.post('/api/tournament', verifyAccess, (req, res) => {
  tournament(req, res);
});

// no token required to access
app.get('/api/tournament', (req, res) => {
  tournament(req, res);
});

// login
app.post('/api/authenticate', (req, res) => {
  authenticate(req, res);
});

app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});


