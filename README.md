# chatApp Project

This project is a RAG-based backend with a CLI application to interact with it. It allows users to create 'personas' by uploading documents and then chat with these personas through the CLI.

## Demo Video

Watch a demo of the ChatApp in action:  
[View Demo Video](https://drive.google.com/file/d/1iZ3ni2yg0JMDZ5G9jjyLCt97_SEU6A57/view)

## Project Structure

- `/backend`: The Express.js/TypeScript backend API handling authentication, data processing, and RAG logic.
- `/cli`: The Node.js/JavaScript CLI tool for user interaction with the backend.
- `/workers`: serverless function with KV to handle analytics data

## Prerequisites

- Node.js (v20.x or later)
- npm (v10.x or later)
- A PostgreSQL database (e.g., from Neon)
- An Upstash account for Vector DB
- Gemini for llm and embeddings
- SpeechFlow for video-text transcription
- tesrect.js for image-text extraction

## Getting Started

### 1. Backend Setup

1.  **Navigate to the project root.**

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the `backend` directory by copying the example:
    ```bash
    cp backend/.env.example backend/.env
    ```
    Fill in the required values in `backend/.env`:
    - `DATABASE_URL`: Your PostgreSQL connection string from Neon.
    - `JWT_SECRET`: A long, random, and secret string for signing JWTs.
    - `UPSTASH_VECTOR_REST_URL`: Your Upstash Vector DB REST URL.
    - `UPSTASH_VECTOR_REST_TOKEN`: Your Upstash Vector DB REST Token.
    - `GEMINI_API_KEY`: Your OpenAI API Key for generating embeddings.
    - `PORT`: The port for the server (defaults to 3000).

4.  **Run database migrations:**
    This will create the necessary tables in your database based on the Drizzle schema.
    ```bash
    npx drizzle-kit push:pg
    ```

5.  **Start the backend server:**
    ```bash
    cd backend
    npm run dev
    ```
    The server will be running on `http://localhost:3000` (or the port you specified).

### 2. CLI Setup & Usage

1.  **Install the CLI globally (for easy access) or link it locally:**
    For local development, from the root directory:
    ```bash
    npm link
    ```
    This makes the `chatapp` command available in your terminal.

2.  **CLI Commands:**

    - **Initialize a chat session with a persona:**
      ```bash
      chatapp init <persona_name>
      chatapp init <persona_name> --token=<access_token>
      ```

    - **Show available public personas:**
      ```bash
      chatapp show persona
      ```

    - **Show data sources for a persona you have access to:**
      ```bash
      chatapp <persona_name> show-data
      ```
      
    - **ask question without connecting**
      ```bash
      chatapp ask <persona_name> -query <question>
      ```

    - **Start an interactive chat session:**
      ```bash
      chatapp
      ```
      Once in the chat, you can ask questions directly.
      ```
      > Explain about yourself
      > What do you know about LLMs
      ```

## API Endpoints

The backend exposes the following REST endpoints:

- `POST /api/auth/signup`: Create a new user account.
- `POST /api/auth/login`: Log in and receive a JWT.
- `POST /api/personas`: Create a new persona (requires auth, file upload).
- `GET /api/personas`: Get a list of public personas.
- `POST /api/personas/:id/query`: Query a specific persona (requires auth/token).
- `GET /api/personas/:id/data`: Get data sources for a persona (requires auth/token).


## workers
### Workers Setup & Development

1. **Install Wrangler (Cloudflare Workers CLI):**
  ```bash
  npm install -g wrangler
  ```

2. **Authenticate with Cloudflare:**
  ```bash
  wrangler login
  ```

3. **Local Development:**
  ```bash
  cd workers
  wrangler dev
  ```
  This starts a local development server.

4. **Deploy to Production:**
  ```bash
  wrangler deploy
  ```

This deploys your worker to Cloudflare's global network.
