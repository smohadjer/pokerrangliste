import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const uri =  process.env.development === 'true' ? process.env.db_uri_local : process.env.db_uri_remote;
const client = new MongoClient(uri);

export default client;
