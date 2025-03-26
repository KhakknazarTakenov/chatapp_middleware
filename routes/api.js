// routes/api.js
import express from 'express';
import { checkWhatsApp } from '../controllers/whatsappController.js';
import { initializeSystem } from '../controllers/initController.js';

const router = express.Router();

router.post('/check_whatsapp/:contact_id/:phoneNumber', checkWhatsApp);
router.post('/init/', initializeSystem);

export default router;