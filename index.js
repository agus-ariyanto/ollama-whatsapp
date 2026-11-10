const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
// const { ollama } = require('@ollama/sdk');
 
const { default: ollama } = require('ollama');
// Define the model string exactly as pulled in Ollama
const MODEL_NAME = 'qwen3:1.7b'; // Change to 'qwen3.5' or 'qwen3.8' if preferred
const OLLAMA_API_URL = 'http://127.0.0.1:11434/api/generate';

const client = new Client({
    authStrategy: new LocalAuth(),
    // puppeteer: {
    //       product: 'firefox',
    //       // 2. Provide the path to your system's Firefox binary
    //       executablePath: '/usr/bin/firefox', 
    //       headless: true,
    //       args: ['--no-sandbox', '--disable-setuid-sandbox']
    // }
        puppeteer: {
            product: 'chromium',
            executablePath: '/usr/bin/chromium', // Replace with your 'which firefox' path
            headless: true,
            // args: [
            //     '--no-sandbox', 
            //     '--disable-setuid-sandbox',
            //     '--disable-extensions',
            //     '--disable-gpu'
            // ]
        }
});


// Initialize WhatsApp client with local session persistence
// const client = new Client({
//     authStrategy: new LocalAuth()
// });

// Display QR code in the terminal
client.on('qr', (qr) => {
    console.log('Scan this QR code with your WhatsApp app:');
    qrcode.generate(qr, { small: true });
});

// Notify when the client is ready
client.on('ready', () => {
    console.log('WhatsApp AI Bot is ready and connected!');
});

// Listen for incoming messages
client.on('message', async (message) => {
    // Ignore status broadcasts or group messages if you only want direct messages (optional)
    if (message.isGroupMsg) return;

    // tambahan untuk prefix message
    // const prefix = '!ai ';

    if (!message.body.startsWith(prefix)) return;

    const chat = await message.getChat();

    if (chat.isGroup) {
        // Ambil info perangkat bot Anda sendiri
        const botId = client.info.wid._serialized;
        
        // Periksa apakah bot di-tag di dalam pesan tersebut
        const isMentioned = message.mentionedIds.includes(botId);

        if (!isMentioned) {
            return; // Abaikan jika tidak di-tag
        }
    }

    // Optional: trigger only if message starts with a specific prefix like "!ai" or reply to all
    const promptText = message.body;

    console.log(`Received message: "${promptText}" from ${message.from}`);

    try {
        // Send request to local Ollama API
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'qwen3:1.7b', // Change to your installed model (e.g., 'qwen2', 'mistral')
            prompt: promptText,
            stream: false
        });

        const replyText = response.data.response;

        // Send back the response to WhatsApp
        await message.reply(replyText);
    } catch (error) {
        console.error('Error communicating with Ollama:', error.message);
        await message.reply('Sorry, I encountered an error connecting to my local AI brain.');
    }
});

/* 
client.on('message', async msg => {
    const chat = await msg.getChat();
    
    if (chat.isGroup) {
        // Ambil info perangkat bot Anda sendiri
        const botId = client.info.wid._serialized;
        
        // Periksa apakah bot di-tag di dalam pesan tersebut
        const isMentioned = msg.mentionedIds.includes(botId);

        if (!isMentioned) {
            return; // Abaikan jika tidak di-tag
        }
    }

    // Jalankan perintah jika di-tag atau jika itu chat pribadi
    if (msg.body.includes('halo')) {
        msg.reply('Halo! Ada yang bisa saya bantu di grup ini?');
    }
});


*/

// Start the client
client.initialize();