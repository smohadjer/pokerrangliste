/* middleware for express.js */
import {jwtVerify} from 'jose';

export default async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  console.log({authHeader});
  console.log('cookies:', req.cookies);

  // we check whether jwt token is sent using authorization header or cookie
  if (authHeader || req.cookies.jwt) {
    const token = authHeader ? authHeader.split(' ')[1] : req.cookies.jwt;
    const secret = new TextEncoder().encode('mySecret');

    try {
      const payload = await jwtVerify(token, secret);
      console.log(payload);
      next();
    } catch(err) {
      res.status(401).json({'error': 401, 'message': 'invalid token'})
    }
  } else {
    console.log('authorization header or jwt cookie missing...');
    if (req.method === 'POST') {
      res.status(403).json({'error': 403, 'message': 'authorization header or cookie not found'});
    } else {
      res.redirect('/login');
    }
  }
}
