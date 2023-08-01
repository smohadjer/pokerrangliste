import dotenv from 'dotenv';

dotenv.config();

const protocol = process.env.development === 'true' ? 'mongodb://' : 'mongodb+srv://';
const uri = protocol + process.env.db_username + ':' + encodeURIComponent(process.env.db_password) + '@' + process.env.db_url;

export default uri;
