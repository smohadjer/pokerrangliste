import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export default async (req, res) => {
  const {username, password} = req.body;

  if (username === process.env.admin_username && password === process.env.admin_password) {
    const token = jwt.sign({
      username: username
    }, 'mySecret', {expiresIn: '1h'});
    res.json({
      "access_token": token
    });
  } else {
    res.status(403).end();
  }
}
