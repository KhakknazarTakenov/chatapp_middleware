// controllers/whatsappController.js
import { checkWhatsAppNumber } from '../utils/whatsapp.js';
import { setIsRegisteredInBitrix } from '../utils/bitrix.js';
import { logMessage } from '../logger/logger.js';
import "../global.js";

export const checkWhatsApp = async (req, res) => {
    const { contact_id, phoneNumber } = req.params;

    // Валидация номера телефона
    let formattedPhoneNumber = phoneNumber;

    // Валидация и форматирование номера телефона
    if (!phoneNumber) {
        logMessage("error", "/chatapp_middleware/check_whatsapp/",
            `No phone number provided`);
        return res.status(400).json({
            success: false,
            message: 'Phone number is required',
        });
    }

    // Убираем все нечисловые символы
    formattedPhoneNumber = phoneNumber.replace(/\D/g, '');

    // Если номер начинается с 8 (Россия), заменяем на 7
    if (formattedPhoneNumber.startsWith('8') && formattedPhoneNumber.length === 11) {
        formattedPhoneNumber = '7' + formattedPhoneNumber.slice(1);
    }

    // Проверяем длину и формат
    if (!/^\d{10,15}$/.test(formattedPhoneNumber)) {
        logMessage("error", "/chatapp_middleware/check_whatsapp/",
            `Invalid phone number after formatting: ${formattedPhoneNumber} (original: ${phoneNumber})`);
        return res.status(400).json({
            success: false,
            message: 'Invalid phone number format (e.g., 12025550123 or 79991234567)',
        });
    }

    // Проверка номера в WhatsApp
    const result = await checkWhatsAppNumber(phoneNumber);
    result.exists
        ? logMessage(LOG_TYPES.I, "checkWhatsApp controller", `Number ${phoneNumber} for contact ${contact_id} is REGISTERED registered in whatsapp`)
        : logMessage(LOG_TYPES.I, "checkWhatsApp controller", `Number ${phoneNumber} for contact ${contact_id} is NOT registered in whatsapp`);

    // controllers/whatsappController.js (фрагмент)
    if (result.success) {
        if (contact_id) { // Обновляем Bitrix независимо от result.exists
            try {
                const bitrixResult = await setIsRegisteredInBitrix(contact_id, result.exists);
                if (!bitrixResult.success) {
                    logMessage("error", "/chatapp_middleware/check_whatsapp/",
                        `Failed to update Bitrix for contact ${contact_id}: ${bitrixResult.error}`);
                }
            } catch (error) {
                logMessage("error", "/chatapp_middleware/check_whatsapp/",
                    `Error updating Bitrix for contact ${contact_id}: ${error.message}`);
            }
        }

        res.json({
            success: true,
            exists: result.exists, // Теперь exists может быть true или false
            details: result.details || {},
            bitrixUpdated: contact_id ? true : false,
            formattedNumber: formattedPhoneNumber,
        });
    } else {
        logMessage(LOG_TYPES.E, "/chatapp_middleware/check_whatsapp/", result.error);
        res.status(503).json({
            success: false,
            message: 'Error checking WhatsApp number',
            error: result.error,
        });
    }
};