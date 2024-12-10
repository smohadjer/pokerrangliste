import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

let uri = process.env.db_uri_local;

if (process.env.development === 'demo') {
    uri = process.env.db_uri_demo;
}

if (process.env.development === 'prod') {
    uri = process.env.db_uri_remote;
}

const client = new MongoClient(uri!);

export default client;
