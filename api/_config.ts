import dotenv from 'dotenv';

dotenv.config();

export const database_name = 'turnies';
export const database_uri = process.env.db_uri;
export const jwtSecret = process.env.jwtSecret;
export const environment = process.env.environment;

