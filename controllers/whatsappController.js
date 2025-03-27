// controllers/whatsappController.js
import { checkWhatsAppNumber } from '../utils/whatsapp.js';
import {
    getLastLineNumberFromContactCenter,
    setIsRegisteredInBitrix,
    updateContactLineId,
} from '../utils/bitrix.js';
import { logMessage } from '../logger/logger.js';
import "../global.js";

export const checkWhatsApp = async (req, res) => {
    const { contact_id } = req.params;

    if (!contact_id) {
        logMessage(LOG_TYPES.E, "/whatsapp_middleware/check_whatsapp/", `No contact ID provided`);
        return res.status(400).json({
            success: false,
            message: 'Contact ID is required',
        });
    }

    try {
        // Обновляем типы номеров телефона в Bitrix на основе проверки WhatsApp
        const bitrixResult = await setIsRegisteredInBitrix(contact_id);
        if (!bitrixResult.success) {
            logMessage("error", "/whatsapp_middleware/check_whatsapp/",
                `Failed to update Bitrix for contact ${contact_id}: ${bitrixResult.error}`);
            return res.status(500).json({
                success: false,
                message: 'Error updating contact in Bitrix',
                error: bitrixResult.error
            });
        }

        logMessage(LOG_TYPES.I, "/whatsapp_middleware/check_whatsapp/", `Whatsapp checked and fields updated in bitrix for contact - ${contact_id}`)

        res.json({
            success: true,
            bitrixUpdated: true,
            message: 'Contact phone types updated successfully'
        });
    } catch (error) {
        logMessage("error", "/whatsapp_middleware/check_whatsapp/",
            `Error processing request for contact ${contact_id}: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Error processing request',
            error: error.message
        });
    }
};

export const updateLineId = async (req, res) => {
    const { contact_id } = req.params;

    if (!contact_id) {
        return res.status(400).json({
            success: false,
            message: 'Contact ID is required'
        });
    }

    try {
        // Получаем информацию о последней линии, с которой контактировал клиент
        const lineResult = await getLastLineNumberFromContactCenter(contact_id);
        if (!lineResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Could not determine line number',
                error: lineResult.error
            });
        }

        const { lineId } = lineResult;

        const bxUpdateResult = await updateContactLineId(contact_id, lineId);

        if (bxUpdateResult) {
            logMessage(LOG_TYPES.I, "/whatsapp_middleware/update_line_id/:ID", `Last line (${lineId}) successfully updated for contact ${contact_id}`);
        } else {
            throw new Error(`Error while updating last line for contact ${contact_id}`)
        }

        res.json({
            success: true,
            message: 'Line ID retrieved successfully',
            lineId: lineId,
            update_result: bxUpdateResult
        });
    } catch (error) {
        logMessage("error", "/whatsapp_middleware/update_line_id/:ID", error.message);
        res.status(500).json({
            success: false,
            message: 'Error retrieving line ID',
            error: error.message
        });
    }
};