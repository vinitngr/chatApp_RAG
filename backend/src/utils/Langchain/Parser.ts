import pdfjs from "pdfjs-dist/legacy/build/pdf.js";
import fs from "fs/promises";
import Tesseract from "tesseract.js";
import { transcribeFile } from "../utils.js";


export async function parsePersona(files: Express.Multer.File[]) {
  const parts: string[] = [];

  for (const file of files) {
    const data = await fs.readFile(file.path);
    const [type, subtype] = file.mimetype.split("/");

    switch (type) {
      case "application":
        if (subtype === "pdf") parts.push(await parsePdf(data));
        break;
      case "video":
        parts.push(await parseVideo(file.path , file.mimetype));
        break;
      case "image":
        parts.push(await parseImage(data));
        break;
      // case "audio":
      //   parts.push(await parseAudio(file.path , file.mimetype));
      //   break;
      default:
        console.log("Unknown type:", file.mimetype);
    }
  }

  return parts.join("\n\n");
}

export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(buffer);
    const pdfDoc = await pdfjs.getDocument({ data: uint8Array }).promise;

    let textContent = "";

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      textContent +=
        content.items.map((item: any) => item.str).join(" ") + "\n";
    }

    return textContent.trim();
  } catch (error) {
    console.error("Error parsing PDF", error);
    throw new Error("Failed to parse PDF file.");
  }
}
export async function parseVideo(path : string , mimeType : string): Promise<string> {
  try {
    const text = await transcribeFile( path , mimeType = "video/mp4" );
    return text || "";
  } catch (error) {
    console.error(`Error parsing PDF at:`, error);
    throw new Error("Failed to parse PDF file.");
  }
}

export async function parseImage(Buffer: Buffer): Promise<string> {
  try {
    const { data: { text } } = await Tesseract.recognize( Buffer, "eng" , {
      logger: (m) => console.log(m),
    });
    return text;
  } catch (error) {
    console.error(`Error parsing image:`, error);
    throw new Error("Failed to parse image.");
  }
}

// export async function parseAudio(path: string , mimeType: string): Promise<string> {
//   try {
//     return "audio transcription";
//   } catch (error) {
//     console.error(`Error parsing Audio:`, error);
//     throw new Error("Failed to parse PDF file.");
//   }
// }
