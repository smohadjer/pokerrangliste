/* middleware for vercel edge runtime */
import { next } from '@vercel/edge';
import {jwtVerify} from 'jose';
import { RequestCookies } from '@edge-runtime/cookies'

// middleware only runs for these paths
export const config = {
  matcher: [
    '/api/tournament',
    '/api/seasons',
    '/api/players'
  ]
};

if (typeof EdgeRuntime === 'string') {
  console.log('******* EdgeRuntime *********');
}

export default async function middleware(req) {
  console.log('middleware: ', req.method, req.url);
  const url = new URL(req.url);

  // only POST requests are restricted
  if (req.method === 'GET') {
    return next();
  }

  const cookies = new RequestCookies(req.headers)
  const jwt = cookies.get('jwt')?.value;
  const authHeader = req.headers.get('authorization');
  const hasBearerAuthHeader = authHeader && authHeader.startsWith('Bearer ');

  // we check whether jwt token is sent using authorization header or cookie
  if (hasBearerAuthHeader || jwt) {
    const token = hasBearerAuthHeader ? authHeader.split(' ')[1] : jwt;
    const secret = new TextEncoder().encode(process.env.jwtSecret);
    console.log({token});

    try {
      const payload = await jwtVerify(token, secret);
      console.log(payload);
      next();
    } catch(err) {
      // return Response.json(
      //   { success: false, message: 'no jwt token or invalid jwt token' },
      //   { status: 401 }
      // )
      console.log('No jwt token or invalid jwt token, redirecting to login page');
      url.pathname = '/login';
      return Response.redirect(url, 302);
    }
  } else {
    // return Response.json(
    //   { success: false, message: 'authorization header not found' },
    //   { status: 403 }
    // )
    console.log('no authorization header or jwt cookie, redirecting to login page');
    url.pathname = '/login';
    return Response.redirect(url, 302);
  }
}
