import fs from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';
import readline from 'readline';

const ENV_FILE = path.join(os.homedir(), '.chatapp_env');

export async function handleInit(input, flags) {
    const id = input[1];
    if (!id) {
        console.error('Error: Persona name is required for init command.');
        return;
    }
    const token = flags.token || '';
    let content = `export ACTIVE_PERSONA_ID="${id}"\n`;
    if (token) content += `export ACTIVE_PERSONA_TOKEN="${token}"\n`;
    fs.writeFileSync(ENV_FILE, content, { encoding: 'utf8' });
    console.log(`Persona initialized. Run:\n  source ${ENV_FILE}`);
}


export async function handleShow(input, flags) {
    const type = input[1];
    if (type === 'persona') {
        console.log('Fetching public personas...');
        try {
            const res = await axios.get('http://localhost:3000/api/personas/');
            const personas = res.data?.personas || [];
            personas.forEach(p => console.log(`- ${p.name} ${p.isPublic ? '(public)' : '(private)'} \n`));
        } catch (error) {
            console.error('Failed to fetch personas:', error.message);
        }
    } else if (type === 'show-data') {
        const personaName = input[0];
        if (!personaName) {
            console.error('Error: Persona name required to show data.');
            return;
        }
        console.log(`Fetching data sources for persona: ${personaName}...`);
        try {
            console.log(flags);
            const  token  = loadSession().token || flags.token || '';
            const res = await axios.get(`http://localhost:3000/api/personas/${personaName}/data?token=${token}&analytics=${flags.analytics || false}`);
            const sources = res.data?.sources?.[0]?.[0]?.contentArray || [];
            const analytics = res.data?.analytics;
            console.log(`Sources for ${personaName}:`);
            console.log(`=============================`);
            sources.forEach(s => console.log(`- ${s.type}: ${s.url}`));
            console.log(`=============================`);
            console.log(`Analytics: ${JSON.stringify(analytics)}`);
            console.log(`=============================`);

        } catch (error) {
            console.error('Failed to fetch data sources:', error.message);
        }
    }
}

export async function handleChat(output) {
    const session = loadSession();
    if (!session.persona) return output?.({ role: 'system', message: 'No persona initialized. Use `chatapp init <persona_name>` first.' });

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: '> ' });
    output?.({ role: 'system', message: `You are now chatting with persona '${session.persona}', Type exit to exit` });
    rl.prompt();

    const history = [];

    rl.on('line', async line => {
        const query = line.trim();
        if (query.toLowerCase() === 'exit') return rl.close();

        history.push({ role: 'user', content: query });
        if (history.length > 5) history.shift();

        output?.({ role: 'user', message: query });

        try {
            const res = await axios.post(`http://localhost:3000/api/personas/${session.persona}/query`, {
                query: [...history],
                token: session.token || undefined
            });

            const aiContent = res.data?.answer?.kwargs?.content || '(No response)';
            history.push({ role: 'ai', content: aiContent });
            if (history.length > 5) history.shift();

            output?.({ role: 'ai', message: aiContent });
        } catch (err) {
            output?.({ role: 'system', message: `Error querying persona: ${err.message}` });
        }

        rl.prompt();
    }).on('close', () => {
        output?.({ role: 'system', message: 'Exiting chat application' });
        process.exit(0);
    });
}

function loadSession() {
    if (!fs.existsSync(ENV_FILE)) return { persona: null, token: null };
    const data = fs.readFileSync(ENV_FILE, 'utf8');
    const personaMatch = data.match(/ACTIVE_PERSONA_ID="(.*)"/);
    const tokenMatch = data.match(/ACTIVE_PERSONA_TOKEN="(.*)"/);
    return {
        persona: personaMatch ? personaMatch[1] : null,
        token: tokenMatch ? tokenMatch[1] : null
    };
}


export async function askAi(id , flags){
    const token = flags.token || '';
    const query = flags.question || '';
    console.log(token , query );
    if(!query) return console.log('Error: Query is required for ask command.');

    const res = await axios.post(`http://localhost:3000/api/personas/${id}/query`, {
        query: [{role : 'user' , content : query}],
        token: token
    });
    const aiContent = res.data?.answer?.kwargs?.content || '(No response)';
    console.log(aiContent);
}