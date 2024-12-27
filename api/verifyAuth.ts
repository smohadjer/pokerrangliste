import {jwtVerify} from 'jose';
import { jwtSecret } from './_config.js';
import { MongoClient } from 'mongodb';
import { database_uri, database_name } from './_config.js';

export default async (request, response) => {
    const cookies = request.cookies;
    const jwt = cookies?.jwt;
    const secret = new TextEncoder().encode(jwtSecret);
    try {
        const result = await jwtVerify(jwt, secret);
        const user = await getUser(result.payload);
        const tenant = {
            id: user._id,
            name: user.username
        };
        response.json({
            data: { tenant }
        });
    } catch(err) {
        response.json({
            error: 'No jwt token or invalid jwt token'
        });
    }
}

async function getUser(payload) {
    const client = new MongoClient(database_uri);
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('tenants');
    const user = await collection.findOne({ username: payload.username });
    return user;
}
