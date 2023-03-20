import dotenv from 'dotenv';

dotenv.config();

// Replace the uri string with your connection string.
const uri =
`mongodb+srv://${process.env.db_username}:${process.env.db_password}@cluster0.8qwlizm.mongodb.net/?retryWrites=true&w=majority`;


export default uri;
