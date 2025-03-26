// utils/bitrix.js
import { Bitrix } from "@2bad/bitrix";
import { logMessage } from "../logger/logger.js";
import "../global.js";
import {decryptText} from "./crypto.js";

export async function setIsRegisteredInBitrix(contact_id, is_registered_in_whatsapp) {
    try {
        const bxLink = await decryptText(process.env.BX_LINK, process.env.CRYPTO_KEY, process.env.CRYPTO_IV);
        const bitrix = Bitrix(bxLink); // Предполагаю, что ссылка хранится в .env
        // Добавьте здесь вашу логику обновления статуса в Bitrix
        const response = await bitrix.call("crm.contact.update", {
            id: contact_id,
            fields: {
                "UF_CRM_1742983582799": is_registered_in_whatsapp ? 1 : 0
            }
        });
        return { success: true, data: response };
    } catch (error) {
        logMessage(LOG_TYPES.E, "setIsRegisteredInBitrix", error);
        return { success: false, error };
    }
}