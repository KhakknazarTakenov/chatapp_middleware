// utils/bitrix.js
import { Bitrix } from "@2bad/bitrix";
import { logMessage } from "../logger/logger.js";
import "../global.js";
import {decryptText} from "./crypto.js";
import {checkWhatsAppNumber} from "./whatsapp.js";

export async function setIsRegisteredInBitrix(contact_id) {
    try {
        const bxLink = await decryptText(process.env.BX_LINK, process.env.CRYPTO_KEY, process.env.CRYPTO_IV);
        const bitrix = Bitrix(bxLink);

        // Получаем текущие данные контакта
        const contactResponse = await bitrix.call("crm.contact.get", { id: contact_id });
        if (!contactResponse.result) {
            throw new Error("Contact not found");
        }
        const contact = contactResponse.result;

        // Получаем текущий массив телефонов
        let phones = contact.PHONE || [];
        if (phones.length === 0) {
            logMessage(LOG_TYPES.I, "setIsRegisteredInBitrix",
                `No phone numbers found for contact ID=${contact_id}`);
            return { success: true, message: "No phone numbers to update" };
        }

        // Проверяем каждый номер телефона
        for (let phone of phones) {
            const phoneNumber = phone.VALUE;

            // Форматируем номер телефона
            let formattedPhoneNumber = phoneNumber.replace(/\D/g, '');
            if (formattedPhoneNumber.startsWith('8') && formattedPhoneNumber.length === 11) {
                formattedPhoneNumber = '7' + formattedPhoneNumber.slice(1);
            }

            if (!/^\d{10,15}$/.test(formattedPhoneNumber)) {
                logMessage(LOG_TYPES.I, "setIsRegisteredInBitrix",
                    `Skipping invalid phone number for contact ID=${contact_id}: ${formattedPhoneNumber} (original: ${phoneNumber})`);
                continue; // Пропускаем некорректные номера
            }

            // Проверяем, зарегистрирован ли номер в WhatsApp
            const result = await checkWhatsAppNumber(formattedPhoneNumber);
            if (result.success) {
                const isRegisteredInWhatsApp = result.exists;
                result.exists
                    ? logMessage(LOG_TYPES.I, "setIsRegisteredInBitrix",
                        `Number ${formattedPhoneNumber} for contact ${contact_id} is REGISTERED in WhatsApp`)
                    : logMessage(LOG_TYPES.I, "setIsRegisteredInBitrix",
                        `Number ${formattedPhoneNumber} for contact ${contact_id} is NOT registered in WhatsApp`);

                // Обновляем VALUE_TYPE в зависимости от результата
                phone.VALUE_TYPE = isRegisteredInWhatsApp ? "MOBILE" : "WORK";
            } else {
                logMessage(LOG_TYPES.E, "setIsRegisteredInBitrix",
                    `Error checking WhatsApp for number ${formattedPhoneNumber}: ${result.error}`);
                // Если проверка не удалась, оставляем VALUE_TYPE без изменений
            }
        }

        // Формируем массив для обновления в формате, ожидаемом API
        const updatedPhones = phones.map(phone => ({
            ID: phone.ID || undefined, // ID должен быть указан для существующих номеров
            VALUE: phone.VALUE,
            VALUE_TYPE: phone.VALUE_TYPE
        }));

        // Обновляем контакт в Bitrix
        const response = await bitrix.call("crm.contact.update", {
            id: contact_id,
            fields: {
                PHONE: updatedPhones
            }
        });

        if (!response.result) {
            throw new Error("Failed to update contact");
        }

        logMessage(LOG_TYPES.I, "setIsRegisteredInBitrix",
            `Successfully updated contact ID=${contact_id} with ${updatedPhones.length} phone numbers`);

        return { success: true, data: response };
    } catch (error) {
        logMessage(LOG_TYPES.E, "setIsRegisteredInBitrix", error);
        return { success: false, error: error.message };
    }
}

// Новая функция для обновления ID линии в карточке контакта
export async function updateContactLineId(contact_id, line_id) {
    try {
        const bxLink = await decryptText(process.env.BX_LINK, process.env.CRYPTO_KEY, process.env.CRYPTO_IV);
        const bitrix = Bitrix(bxLink);

        const response = await bitrix.call("crm.contact.update", {
            id: contact_id,
            fields: {
                "UF_CRM_1743003389885": line_id // Пользовательское поле для ID линии
            }
        });

        return { success: true, data: response };
    } catch (error) {
        logMessage(LOG_TYPES.E, "updateContactLineId", error);
        return { success: false, error };
    }
}
// Новая функция для получения последнего номера линии из Контакт-центра
export async function getLastLineNumberFromContactCenter(contact_id) {
    try {
        const bxLink = await decryptText(process.env.BX_LINK, process.env.CRYPTO_KEY, process.env.CRYPTO_IV);
        const bitrix = Bitrix(bxLink);

        let lineId = null;
        let phoneNumber = null;

        // Получаем ID последнего чата, связанного с контактом
        const chatResponse = await bitrix.call("imopenlines.crm.chat.getLastId", {
            CRM_ENTITY_TYPE: "CONTACT",
            CRM_ENTITY: contact_id
        });

        if (!chatResponse.result) {
            logMessage(LOG_TYPES.I, "getLastLineNumberFromContactCenter",
                `No last chat found for contact ID=${contact_id}`);
            throw new Error("No open line chat found for this contact");
        }

        const chatId = chatResponse.result; // ID чата напрямую в result
        logMessage(LOG_TYPES.I, "getLastLineNumberFromContactCenter",
            `Found last chat for contact ID=${contact_id}, chatId=${chatId}`);

        // Получаем информацию о диалоге
        const dialogInfoResponse = await bitrix.call("im.dialog.get", {
            DIALOG_ID: `chat${chatId}`
        });

        if (!dialogInfoResponse.result || dialogInfoResponse.result.entity_type !== "LINES") {
            logMessage(LOG_TYPES.I, "getLastLineNumberFromContactCenter",
                `Chat ID=${chatId} is not an open line chat`);
            throw new Error("Last chat is not associated with an open line");
        }

        // Извлекаем ID линии и ID контакта из entity_id (например, "olchat_wa_connector_2|20|77775404357|170586")
        const entityIdParts = dialogInfoResponse.result.entity_id.split("|");
        lineId = entityIdParts[1]; // ID линии (например, "20")

        logMessage(LOG_TYPES.I, "getLastLineNumberFromContactCenter",
            `Selected line: lineId=${lineId}, phoneNumber=${phoneNumber}`);

        return {
            success: true,
            lineId: lineId,
        };
    } catch (error) {
        logMessage(LOG_TYPES.E, "getLastLineNumberFromContactCenter", error);
        return { success: false, error: error.message };
    }
}