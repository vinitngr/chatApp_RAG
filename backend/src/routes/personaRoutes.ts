import { Router } from "express";
import multer from "multer";
import {
  createPersona,
  getPersonas,
  queryPersona,
  getPersonaData,
} from "../controllers/personaController.js";
import { protectedRoutes } from "../middlewares/authMiddleware.js";
import path from "path";

declare module "express-serve-static-core" {
  interface Request {
    personaUUID?: any;
    fileInfos?: any;
  }
}

const router = Router();


const BASE_URL = "http://localhost:3000/uploads";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    let personaName = req.body.personaName.replace(/\s+/g, '');
    const ext = path.extname(file.originalname);
    const fileType = file.mimetype.split('/')[1]; 

    const nameWithoutExt = path.basename(file.originalname, ext);
    const filename = `${personaName}_${nameWithoutExt.replace(/\s+/g, '')}${ext}`;
    if (!req.fileInfos) req.fileInfos = [];
    req.fileInfos.push({
      type: fileType,
      url: `${BASE_URL}/${filename}`
    });

    cb(null, filename);
  }
});

const upload = multer({ storage });


router.post("/", protectedRoutes, upload.array("files"), createPersona);
router.get("/", getPersonas);
router.post("/:id/query", queryPersona);
router.get("/:id/data", getPersonaData);

export default router;
