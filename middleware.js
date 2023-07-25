// Basic Auth example via Vercel edge middleware and without using a framework

import { next } from '@vercel/edge';

export default function middleware(req) {
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    // we can not import and use dotenv package in edge runtime, but we can use process.env to access environment variables as mentioned here: https://vercel.com/docs/concepts/functions/edge-functions/edge-runtime
    if (user === process.env.admin_username && pwd === process.env.admin_password) {
      next();
    } else {
      return new Response('credentials wrong', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic' },
      });
    }
  } else {
    return new Response('credentials missing', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic' },
    });
  }
}

export const config = {
  matcher: '/admin.html',
};
