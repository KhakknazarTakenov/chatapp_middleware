import express from 'express';
import axios from 'axios';
import cors from "cors";
import dotenv from 'dotenv';
import bodyParser from "body-parser";
import path from "path";

import {logMessage} from "./logger/logger.js";

// Initialize Express app
const app = express();
const port = 4237;

const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Green API credentials (replace with your actual values)
const idInstance = process.env.GREEN_API_ID_INSTANCE; // From Green API console
const apiTokenInstance = process.env.GREEEN_API_TOKEN_INSTANCE; // From Green API console
const baseUrl = 'https://api.green-api.com'; // Green API base URL

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors({
    origin: "*",
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Function to check WhatsApp number status
async function checkWhatsAppNumber(phoneNumber) {
    const url = `${baseUrl}/waInstance${idInstance}/checkWhatsapp/${apiTokenInstance}`;

    try {
        const response = await axios.post(
            url,
            {
                phoneNumber: phoneNumber, // Number in international format without +
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = response.data;

        // Green API returns { "exists": true } or { "exists": false }
        return {
            success: true,
            exists: data.exists,
            details: data,
        };
    } catch (error) {
        return {
            success: false,
            exists: false,
            error: error.response ? error.response.data : error.message,
        };
    }
}

// Endpoint to check WhatsApp number
app.get('/chatapp_middleware/check_whatsapp/:phoneNumber', async (req, res) => {
    const { phoneNumber } = req.params;

    // Basic validation
    if (!phoneNumber || !/^\d{10,15}$/.test(phoneNumber)) {
        logMessage("error", "/chatapp_middleware/check_whatsapp/", `Invalid phone number. Please provide a valid number in international format (e.g., 12025550123). Phone: ${phoneNumber}`)
        return res.status(400).json({
            success: false,
            message: 'Invalid phone number. Please provide a valid number in international format (e.g., 12025550123).',
        });
    }

    const result = await checkWhatsAppNumber(phoneNumber);

    if (result.success) {
        res.json({
            exists: true,
            details: result.details || {},
        });
    } else {
        logMessage("error", "/chatapp_middleware/check_whatsapp/", result.error)
        res.status(503).json({
            success: false,
            message: 'Error checking WhatsApp number.',
            error: result.error,
        });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});