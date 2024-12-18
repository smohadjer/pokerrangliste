import { SignJWT } from 'jose';
import { jwtSecret, environment } from './_config.js';

export default async (req, res) => {
  const { username, password } = req.body;

  let authenticated = false;

  if (environment === 'demo') {
    authenticated = (username === process.env.admin_demo_username) &&
    (password === process.env.admin_demo_password);
  } else {
    authenticated = (username === process.env.admin_username &&
      password === process.env.admin_password);
  }

  if (authenticated) {
    const secret = new TextEncoder().encode(jwtSecret);
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
  // if we are not running app locally use secure so cookie is sent only over https
  const secure = (environment === 'local') ? '' : '; Secure';

  // set cookie expiry date to a year later
  const cookieDate = new Date();
  cookieDate.setFullYear(cookieDate.getFullYear() + 1);

  // setting token in a httpOnly cookie, we need to specify Path since we
  // want browser to send cookie when page outside /api folder is requested
  // as we also use the cookie to allow access to public/admin.html
  res.setHeader('Set-Cookie', [`jwt=${token}; Expires=${cookieDate.toUTCString()}; HttpOnly; Path=/${secure}`]);
}
