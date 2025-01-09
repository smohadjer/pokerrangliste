import { SignJWT } from 'jose';
import { jwtSecret, environment, database_uri, database_name } from './_config.js';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

const client = new MongoClient(database_uri);

export default async (req, res) => {
  const { username, password } = req.body;
  let authenticated = false;

  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('tenants');

    if (req.method === 'POST') {
      const user = await collection.findOne({ username: username });
      if (!user) {
        throw new Error('login failed');
      } else {
        if (await bcrypt.compare(password, user.password)) {
          authenticated = true;
          console.log('user._id:', user._id);
        } else {
          throw new Error('login failed');
        }
      }

      if (authenticated) {
        const secret = new TextEncoder().encode(jwtSecret);
        const alg = 'HS256';
        const token = await new SignJWT({
            name: user.username,
            id: user._id
          })
          .setProtectedHeader({ alg })
          .setExpirationTime('10w')
          .sign(secret);

        setCookieServerless(res, token);

        // login form is submitted via ajax, redirect happens on client
        const tenant = {
          id: user._id,
          name: user.username
        };
        res.json({
          data: { tenant }
        });

        // login form is submitted without ajax, redirect happens on server
        // res.setHeader('Location', '/admin');
        // res.status(302).end();
      }
    }
  } catch (e) {
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
