import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { createVectorStore } from "@/db/vectorDb.js";

export function createllm(
  model: string = "gemini-2.0-flash",
  temperature: number = 0,
  maxOutputTokens: number = 256,
  kind: "gemini" | "chatgpt" = "gemini"
): ChatGoogleGenerativeAI {
  switch (kind) {
    case "gemini":
      return new ChatGoogleGenerativeAI({
        model,
        temperature,
        maxOutputTokens,
      });
    // case "chatgpt" : return new ChatOpenAI({ model, temperature, maxOutputTokens });
    default:
      return new ChatGoogleGenerativeAI({
        model,
        temperature,
        maxOutputTokens,
      });
  }
}

export const geminiModel = createllm("gemini-2.0-flash", 0, 256, "gemini");

export async function storeToRAG() {}

export async function getRagContext(
  query: string,
  personaName: string,
  token?: string
) {
  const geminiEmbeddings = createEmbeddings(personaName);
  const vectorStore = createVectorStore(geminiEmbeddings);
  let searchResults;
  console.log("====================" , personaName);
  try {
    const filter = {
      personaId: {
        $eq: personaName,
      },
    };
    searchResults = await vectorStore.similaritySearchWithScore( query , 3 , filter);
  } catch (error) {
    throw new Error(`Error while fetching data from vector db ${error}`);
  }
  let finalData = searchResults?.map(d => d[0].pageContent).join("\n\n");
  return finalData;
}

export const createEmbeddings = (title = "Document title") =>
  new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    taskType: TaskType.RETRIEVAL_DOCUMENT,
    title,
  });
