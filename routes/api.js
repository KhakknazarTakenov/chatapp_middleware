// routes/api.js
import express from 'express';
import { checkWhatsApp, updateLineId } from '../controllers/whatsappController.js';
import { initializeSystem } from '../controllers/initController.js';

const router = express.Router();

router.post('/check_whatsapp/:contact_id', checkWhatsApp);
router.post('/init/', initializeSystem);
router.post('/update_line_id/:contact_id', updateLineId);

export default router;