import { UpstashVectorStore } from "@langchain/community/vectorstores/upstash";
import { Index } from "@upstash/vector";
import "dotenv/config";
import { Embeddings } from "@langchain/core/embeddings";

export const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

export function createVectorStore(embeddings: Embeddings){
  return new UpstashVectorStore(embeddings, {
    index: vectorIndex,
  });
}

console.log("<== Upstash vector DB initilized ==>");
