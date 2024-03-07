/* middleware for express.js */
import {jwtVerify} from 'jose';

export default async (req, res, next) => {
  const jwt = req.cookies?.jwt;
  const authHeader = req.headers['authorization'];
  const hasBearerAuthHeader = authHeader && authHeader.startsWith('Bearer ');

  // we check whether jwt token is sent using authorization header or cookie
  if (hasBearerAuthHeader || jwt) {
    const token = hasBearerAuthHeader ? authHeader.split(' ')[1] : jwt;
    const secret = new TextEncoder().encode('mySecret');
    console.log({token});

    try {
      const payload = await jwtVerify(token, secret);
      console.log(payload);
      next();
    } catch(err) {
      //res.status(401).json({'error': 401, 'message': 'invalid token'})
      res.redirect('/login');
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
