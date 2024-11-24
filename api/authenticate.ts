import dotenv from 'dotenv';
import {SignJWT} from 'jose';

dotenv.config();

export default async (req, res) => {
  const { username, password } = req.body;

  console.log('req arrived', password)

  if (username === process.env.admin_username &&
    password === process.env.admin_password) {
    const secret = new TextEncoder().encode(process.env.jwtSecret);
    const alg = 'HS256';
    const token = await new SignJWT({ 'username': username })
      .setProtectedHeader({ alg })
      .setExpirationTime('10w')
      .sign(secret);

      setCookieServerless(res, token);

    // login form is submitted via ajax, redirect happens on client
    res.json({});

    // login form is submitted without ajax, redirect happens on server
    // res.setHeader('Location', '/admin');
    // res.status(302).end();
  } else {
    console.error('wrong credentials!');

    // login form is submitted via ajax, redirect happens on client
    res.status(401).json({ error: 'wrong credentials' });

    // login form is submitted without ajax, redirect happens on server
    // res.setHeader('Location', '/login');
    // res.status(302).end();
  }
}

function setCookieServerless(res, token) {
  // use secure on production so cookie is sent only over https
  const secure = process.env.development ? '' : '; Secure';

  // set cookie expiry date to a year later
  const cookieDate = new Date();
  cookieDate.setFullYear(cookieDate.getFullYear() + 1);

  // setting token in a httpOnly cookie, we need to specify Path since we
  // want browser to send cookie when page outside /api folder is requested
  // as we also use the cookie to allow access to public/admin.html
  res.setHeader('Set-Cookie', [`jwt=${token}; Expires=${cookieDate.toUTCString()}; HttpOnly; Path=/${secure}`]);
}
