// app.js
import express from 'express';
import cors from "cors";
import dotenv from 'dotenv';
import bodyParser from "body-parser";
import path from "path";
import apiRoutes from './routes/api.js';

const app = express();
const port = 4237;

dotenv.config({ path: path.join(process.cwd(), '.env') });

app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Подключаем маршруты
app.use('/whatsapp_middleware/', apiRoutes);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

export default app;