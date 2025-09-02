#!/usr/bin/env node

import meow from 'meow';
import { handleInit,  handleChat , handleShow, askAi } from './commands/handlers.js';

const cli = meow(`
  Usage
    $ chatapp <command>

  Commands
    init <persona_name>  Initializes a chat with a persona. Use --token for private personas.
    show persona         Lists available public personas.
    <persona_name> show-data  Shows the data sources for a given persona.
    (no command)         Starts an interactive chat session.

  Options
    --token, -t  Access token for private personas.
    --help       Show this help message.
    --version    Show version information.
    --question -q ask question without connecting
  Examples
    $ chatapp init einstein
    $ chatapp init my_private_docs --token=XYZ123
    $ chatapp show persona
    $ chatapp einstein show-data -analytics
    $ chatapp
    $ chatapp ask einstein -q "What is the meaning of life?" 
`, {
  importMeta: import.meta,
  flags: {
    token: {
      type: 'string',
      shortFlag: 't'
    },
    question: {
      type: 'string',
      shortFlag: 'q'
    },
    analytics: {
      type: "boolean",
      shortFlag: 'a'
    }
  }
});

const { input, flags } = cli;
const command = input[0];

(async () => {
  if (command === 'init') {
    await handleInit(input, flags);
  } else if (command === 'show' && input[1] === 'persona') {
    await handleShow(input, flags);
  } else if (input[1] === 'show-data') {
    await handleShow(input, flags);
  } else if (command === 'ask') {
    await askAi(input[1] , flags);
  } else if (!command) {
    await handleChat(msg => {
      if (msg.role === 'user') process.stdout.write(`You: ${msg.message}\n`);
      else if (msg.role === 'ai') process.stdout.write(`AI: ${msg.message}\n`);
      else if (msg.role === 'system') process.stdout.write(`System: ${msg.message}\n`);
      else process.stdout.write(`${msg.message}\n`);
    });
  } else {
    console.log('Unknown command. Use `chatapp --help` to see available commands');
  }
})();
