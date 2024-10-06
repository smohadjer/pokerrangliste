import dotenv from 'dotenv';
import {SignJWT} from 'jose';

dotenv.config();

export default async (req, res) => {
  const {username, password} = req.body;

  if (username === process.env.admin_username &&
    password === process.env.admin_password) {
    const secret = new TextEncoder().encode(process.env.jwtSecret);
    const alg = 'HS256';
    const token = await new SignJWT({ 'username': username })
      .setProtectedHeader({ alg })
      .setExpirationTime('10w')
      .sign(secret);

    /*
    // sending access token as json in body of response
    // use this method when fetching token with JavaScript
    res.json({
      "access_token": token
    });
    */

      setCookieServerless(res, token);
  } else {
    console.log('wrong credentials');
    res.setHeader('Location', '/login');
    res.status(302).end();
    //res.status(403).end();
  }
}

function setCookieServerless(res, token) {
  // use secure on production so cookie is sent only over https
  const secure = process.env.development ? '' : '; Secure';

  // setting Location header for a redirect to admin page
  res.setHeader('Location', '/admin');

  // setting token in a httpOnly cookie, we need to specify Path since we
  // want browser to send cookie when page outside /api folder is requested
  // as we also use the cookie to allow access to public/admin.html
  res.setHeader('Set-Cookie', [`jwt=${token}; HttpOnly; Path=/${secure}`]);

  // redirecting to admin page
  res.status(302).end();
}
