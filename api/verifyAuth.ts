import {jwtVerify} from 'jose';
import { jwtSecret } from './_config.js';

export default async (request, response) => {
    const cookies = request.cookies;
    const jwt = cookies?.jwt;
    const secret = new TextEncoder().encode(jwtSecret);

    try {
        const payload = await jwtVerify(jwt, secret);
        console.log(payload);
        response.status(200).json({valid: true})
    } catch(err) {
        console.log('No jwt token or invalid jwt token, redirecting to login page');
        response.status(200).json({valid: false})
    }
}
