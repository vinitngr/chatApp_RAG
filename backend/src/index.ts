import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from "path";
import authRoutes from './routes/authRoutes.js';
import personaRoutes from './routes/personaRoutes.js';
import cookieParser from 'cookie-parser';

import { fileURLToPath } from "url";
import { db } from './db/db.js';
import { persona } from './schemas/schema.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/uploads', express.static(path.join('uploads')));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(cookieParser());
app.use(cors());
app.use(express.json()); 

app.get('/', (_req: Request, res: Response) => {
  res.send('healty');
});
app.get("/persona-form", (req, res) => {
  res.render("createPersona");
});
app.use('/api/auth',  authRoutes);
app.use('/api/personas', personaRoutes);


app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT} \n form - http://localhost:${PORT}/persona-form`);
});
