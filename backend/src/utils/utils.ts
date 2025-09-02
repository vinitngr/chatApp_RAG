import jwt from "jsonwebtoken";
import { Response } from "express";

export const generateAndSetToken = ( userId: any , res : Response ): string => {
      const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
        expiresIn: "7d",
      });
      
      res.cookie("chatappcookie", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, 
        httpOnly: true, 
        sameSite: "strict", 
        secure: process.env.ENV !== "development",
      });

  return token;
};


import fs from "fs";

const LANG = "en";
const BASE = "https://api.speechflow.io/asr/file/v1";

export async function transcribeFile(path: string, mimeType: string): Promise<string> {
  const fileBuf = fs.readFileSync(path);
  const form = new FormData();
  form.append("file", new Blob([fileBuf], { type: mimeType }), path.split(/[\\/]/).pop() || "upload");

  const createRes = await fetch(`${BASE}/create?lang=${LANG}`, {
    method: "POST",
    headers: { keyId: process.env.API_KEY_ID! , keySecret: process.env.API_KEY_SECRET! },
    body: form,
  });
  const createJson = await createRes.json();
  if (createJson.code !== 10000) throw new Error(createJson.msg || "create failed");

  const taskId = createJson.taskId;

  while (true) {
    const res = await fetch(`${BASE}/query?taskId=${taskId}&resultType=4`, {
      headers: { keyId: process.env.API_KEY_ID!, keySecret: process.env.API_KEY_SECRET! },
    });
    const json = await res.json();

    if (json.code === 11000) {
      if (!json.result) throw new Error("No transcript returned");
      return json.result;
    }
    if (json.code !== 11001) throw new Error(json.msg || "transcription error");
    await new Promise(r => setTimeout(r, 3000));
  }
}