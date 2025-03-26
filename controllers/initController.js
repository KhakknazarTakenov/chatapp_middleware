// controllers/initController.js
import fs from 'fs';
import path from 'path';
import {encryptText, generateCryptoKeyAndIV} from '../utils/crypto.js';
import { logMessage } from '../logger/logger.js';
import "../global.js";

export const initializeSystem = async (req, res) => {
    try {
        const { bx_link } = req.body;

        if (!bx_link) {
            return res.status(400).json({
                status: false,
                status_msg: "error",
                message: "Необходимо предоставить ссылку входящего вебхука!"
            });
        }

        const keyIv = generateCryptoKeyAndIV();
        const bxLinkEncrypted = await encryptText(bx_link, keyIv.CRYPTO_KEY, keyIv.CRYPTO_IV);
        const bxLinkEncryptedBase64 = Buffer.from(bxLinkEncrypted, 'hex').toString('base64');

        const envContent = `CRYPTO_KEY=${keyIv.CRYPTO_KEY}\nCRYPTO_IV=${keyIv.CRYPTO_IV}\nBX_LINK=${bxLinkEncryptedBase64}\n`;
        fs.writeFileSync(path.resolve(process.cwd(), '.env'), envContent, 'utf8');

        res.status(200).json({
            status: true,
            status_msg: "success",
            message: "Система готова работать с вашим битриксом!",
        });
    } catch (error) {
        logMessage("error", "/chatapp_middleware/init", error);
        res.status(500).json({
            status: false,
            status_msg: "error",
            message: "Server error"
        });
    }
};