import { db } from "@/db/db.js";
import { persona } from "@/schemas/schema.js";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "langchain/document";

import {
  createEmbeddings,
  getRagContext,
  geminiModel as model,
} from "@/utils/Langchain/langchainService.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { parsePersona } from "@/utils/Langchain/Parser.js";
import { createVectorStore } from "@/db/vectorDb.js";

declare module "express-serve-static-core" {
  interface Request {
    locals?: any;
  }
}

export const createPersona = async (req: Request, res: Response) => {
  let { personaName, isPublic = true, token, text } = req.body;

  const files = req.files as Express.Multer.File[];
  const user = res.locals.user;
  personaName = personaName.replace(/\s+/g, "");
  isPublic = isPublic === true || isPublic === "true";
  console.log(isPublic, token, personaName);

  if (!isPublic) {
    if (!token || token.length == 0) {
      return res
        .status(400)
        .json({ message: "Token is required. for private persona" });
    }
  }

  const existing = await db
    .select()
    .from(persona)
    .where(eq(persona.personaName, personaName));
  if (existing.length > 0) {
    return res.status(400).json({
      message: `Persona '${personaName}' already exists.`,
    });
  }

  if (!personaName)
    return res.status(400).json({ message: "Persona name is required." });
  if (!files || files.length === 0)
    return res
      .status(400)
      .json({ message: "Atleast at least one file is required." });

  console.log(`Creating persona '${personaName}'...`);

  let personaContent = `${text}\n\n` || "";

  try {
    console.log("parsing personal data");
    personaContent += await parsePersona(files);
  } catch (error) {
    console.log("Error while parsing persona");
    return res.status(500).json({
      message: "Failed to create persona - parsing error",
      error,
      success: false,
    });
  }

  try {
    console.log("Storing persona data to vector database");
    const geminiEmbeddings = createEmbeddings(personaName);
    const vectorStore = createVectorStore(geminiEmbeddings);

    const processedDocs = processContentFXN(personaContent!);
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 900,
      chunkOverlap: 300,
    });

    const docs = new Document({ pageContent: processedDocs });
    const allSplits = await splitter.splitDocuments([docs]);
    const documentsWithBatch = allSplits.map((doc, index) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        personaId: personaName,
      },
    }));
    const ids = allSplits.map((_, index) => `doc-${personaName}-${index}`);
    try {
      await vectorStore.addDocuments(documentsWithBatch, { ids });
    } catch (error) {
      console.log("Error while performing vector store operations");
      return res.status(500).json({
        message: "Failed to store persona - vector store error",
        error,
        success: false,
      });
    }
  } catch (error) {
    console.log("Error while performing pre vector store operations");
    return res.status(500).json({
      message: "Failed to create persona - pre vector store error",
      error,
      success: false,
    });
  }

  try {
    console.log("storing persona config data to db...");
    await db.insert(persona).values({
      createdBy: user[0].id,
      personaName,
      isPublic: isPublic === true || isPublic === "true",
      Token: token || null,
      contentArray: req.fileInfos,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to store persona config to db",
      error,
      success: false,
    });
  }

  console.log("Persona created successfully.");
  res.status(201).json({
    message: `Persona '${personaName}' created successfully.`,
    personaName: personaName,
    success: true,
  });
};

export const getPersonas = async (req: Request, res: Response) => {
  let result = [];
  try {
    const res = await db.select().from(persona);
    result = res
      .filter((item) => item.isPublic)
      .map((item) => ({
        personaId: item.personaId,
        name: item.personaName,
        isPublic: item.isPublic,
        contentArray: item.contentArray,
      }));
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to retrieve personas", error, success: false });
  }
  res.status(200).json({ personas: result });
};

export const queryPersona = async (req: Request, res: Response) => {
  const personaName = req.params.id;
  const { query, token } = req.body;

  if (!query || !Array.isArray(query) || query.length === 0) {
    return res.status(400).json({ message: "Query is required!" });
  }

  const personaa = await db
    .select()
    .from(persona)
    .where(eq(persona.personaName, personaName));

  if (!personaa || personaa.length === 0) {
    return res.status(404).json({ message: "Persona not found" });
  }

  if (
    personaa[0].isPublic == false &&
    personaa[0].Token &&
    personaa[0].Token != token
  )
    return res
      .status(401)
      .json({ message: "Unauthorized require Token to access" });

  const systemPrompt = new SystemMessage(
    "tone - You are a helpful RAG assistant. Answer the latest query based on previous chat history and context. Be informative, concise, and formatted clearly."
  );

  const latestQuery = query[query.length - 1];
  const prevChat = query.slice(Math.max(query.length - 6, 0), query.length - 1);
  let context;
  try {
    context = await getRagContext(latestQuery.content, personaName, token);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get rag context",
      error,
      success: false,
    });
  }

  const prompt = `
    --- Previous Chat History ---
    ${prevChat.map((item) => `${item.role}: ${item.content}`).join("\n")}

    --- Relevant Context ---
    ${context}

    --- Latest User Query ---
    ${
      latestQuery.content ||
      "no context provided answer based on prev chat or your knowledge"
    }

    Instructions:
    - Use context only if it’s relevant to the latest query.
    - Answer directly and clearly.
    - Preserve formatting if applicable.
    - Do not invent information outside the context provided.
    `;

  let result;
  console.log(prompt);
  try {
    result = await model.invoke([systemPrompt, new HumanMessage(prompt)]);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to query persona - llm response Error",
      error,
      success: false,
    });
  }
  try {
    await fetch(
      `${process.env.analyticURL}/${personaName}/analytics?type=aiquery&token=${result.usage_metadata?.total_tokens || 0}`,
      {
        method: "POST",
      }
    );
  } catch (error) {
    console.log("something wrong with analytics api");
  }

  res.status(200).json({ answer: result, success: true });
};

export const getPersonaData = async (req: Request, res: Response) => {
  const personaName = req.params.id;
  const token = req.query.token;
  const analytics = req.query.analytics;
  // TODO: Implement memory storage to prevent API calls
  const personaSources = await db
    .select()
    .from(persona)
    .where(eq(persona.personaName, personaName));

  if (!personaSources || personaSources.length === 0) {
    return res.status(404).json({ message: "Persona not found" });
  }
  if (
    personaSources[0].isPublic == false &&
    personaSources[0].Token &&
    personaSources[0].Token != token
  )
    return res
      .status(401)
      .json({ message: "Unauthorized require Token to access" });

  try {
    await fetch(
      `${process.env.analyticURL}/${personaName}/analytics?type=contentfetched`,
      {
        method: "POST",
      }
    );
  } catch (error) {
    console.log("something wrong with analytics api");
  }
  let analyticsResult ;
  if (analytics == "true") {
    try {
      const res = await fetch(`${process.env.analyticURL}/${personaName}/analytics` , { method: "GET" });
      analyticsResult = await res.json();
    } catch (error) {
      console.log("something wrong with analytics api");
    }
  }
  console.log("analyticsResult" , analyticsResult);

  res.status(200).json({ sources: [personaSources], analytics: analyticsResult });
};

export function processContentFXN(content: string) {
  return content
    .replace(/\s+/g, " ")
    .replace(/[^\w\s.,!?'-]/g, "")
    .trim();
}
