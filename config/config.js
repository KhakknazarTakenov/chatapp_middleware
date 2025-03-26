// config/config.js
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export const config = {
    greenApi: {
        idInstance: process.env.GREEN_API_ID_INSTANCE,
        apiTokenInstance: process.env.GREEN_API_TOKEN_INSTANCE,
        baseUrl: 'https://api.green-api.com'
    }
};