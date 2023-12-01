/* middleware for vercel edge runtime */
import { next } from '@vercel/edge';
import {jwtVerify} from 'jose';

export default async function middleware(req) {
  // only POST requests require authentication
  if (req.method === 'GET') {
    return next();
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const secret = new TextEncoder().encode('mySecret');
    try {
      const payload = await jwtVerify(token, secret);
      next();
    } catch(err) {
      return Response.json(
        { success: false, message: 'no jwt token or invalid jwt token' },
        { status: 401 }
      )
    }
  } else {
    return Response.json(
      { success: false, message: 'authorization header not found' },
      { status: 403 }
    )
  }
}

export const config = {
  matcher: '/api/*'
}
