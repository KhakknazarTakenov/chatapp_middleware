// utils/whatsapp.js
import axios from 'axios';
import { config } from '../config/config.js';

export async function checkWhatsAppNumber(phoneNumber) {
    const url = `${config.greenApi.baseUrl}/waInstance${config.greenApi.idInstance}/checkWhatsapp/${config.greenApi.apiTokenInstance}`;

    try {
        const response = await axios.post(
            url,
            { phoneNumber },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return {
            success: true,
            exists: response.data.existsWhatsapp,
            details: response.data,
        };
    } catch (error) {
        return {
            success: false,
            exists: false,
            error: error.response ? error.response.data : error.message,
        };
    }
}