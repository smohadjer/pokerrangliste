import {jwtVerify} from 'jose';
import { jwtSecret } from './_config.js';
import { JwtPayload } from '../public/ts/types'

export default async (request, response) => {
    const payload: JwtPayload = await getJwtPayload(request);
    if (payload) {
        console.log('jwt payload: ', payload);
        return response.status(200).json({
            name: payload.name,
            id: payload.id
        });
    } else {
        const error = 'No jwt token or invalid jwt token, redirecting to login page';
        response.status(500).json({error})
    }
}

export const getJwtPayload = async (req) : Promise<JwtPayload> => {
    const jwt = req.cookies?.jwt;
    const authHeader = req.headers?.authorization;
    const hasBearerAuthHeader = authHeader && authHeader.startsWith('Bearer ');
    const token = hasBearerAuthHeader ? authHeader.split(' ')[1] : jwt;
    console.log(token);
    const secret = new TextEncoder().encode(jwtSecret);

    try {
        const jwtResponse = await jwtVerify<JwtPayload>(token, secret);
        return jwtResponse.payload;
    } catch(error) {
        console.error(error);
        return;
    }
}
