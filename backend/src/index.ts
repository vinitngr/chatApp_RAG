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


app.get("/dbstore", async (req, res) => {
  try {
    await db.insert(persona).values({
      personaId: "23e5d29d-242e-457b-b17a-274f2a9f6edd",
      createdBy: "23e5d29d-242e-457b-b17a-274f2a9f6ed3",
      isPublic: true,
      Token: "vinit",
      personaName: "vinit ka persona",
      contentArray: [
        { type: "image", url: "1" },
        { type: "video", url: "1" },
        { type: "pdf", url: "1" },
      ],
    });
    res.status(201).json({ message: "Persona stored successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error storing persona", error: err });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT} \n form - http://localhost:${PORT}/persona-form`);
});
