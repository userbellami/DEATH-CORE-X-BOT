const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

process.on('uncaughtException', (err) => console.log('⚠️ Uncaught Exception:', err.message));
process.on('unhandledRejection', (err) => console.log('⚠️ Unhandled Rejection:', err.message));

if (!fs.existsSync('./node_modules')) {
    console.log("📦 Installing dependencies...");
    try { execSync('npm install --unsafe-perm --allow-git=all', { stdio: 'inherit' }); }
    catch (e) { process.exit(1); }
}

const { Telegraf } = require('telegraf');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestWaWebVersion, makeCacheableSignalKeyStore, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const config = require('./config');
const handler = require('./handler');

const bot = new Telegraf(config.telegramToken);
const SESSION_ROOT = path.resolve('./sessions');
const waSessions = new Map();
const socketLastActive = new Map();

if (!fs.existsSync(SESSION_ROOT)) fs.mkdirSync(SESSION_ROOT, { recursive: true, mode: 0o700 });

function waUserDir(phoneNumber) {
    if (!/^\d{8,15}$/.test(phoneNumber)) throw new Error('Invalid phone number.');
    return path.join(SESSION_ROOT, phoneNumber);
}

async function connectSession(phoneNumber) {
    const dir = waUserDir(phoneNumber);
    if (!fs.existsSync(dir)) await fsp.mkdir(dir, { recursive: true, mode: 0o700 });
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const { version } = await fetchLatestWaWebVersion();

    const silentLogger = pino({ level: 'silent' });

    const sock = makeWASocket({
        version,
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, silentLogger) },
        logger: silentLogger,
        printQRInTerminal: false,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        browser: Browsers.ubuntu("Chrome"),
        keepAliveIntervalMs: 30000,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        emitOwnEvents: true,
        retryRequestDelayMs: 2000
    });

    waSessions.set(phoneNumber, sock);
    socketLastActive.set(phoneNumber, Date.now());

    const watchdog = setInterval(async () => {
        const lastActive = socketLastActive.get(phoneNumber);
        if (Date.now() - lastActive > 180000) {
            console.log(`🚨 Watchdog: Socket for ${phoneNumber} is dead. Restarting...`);
            clearInterval(watchdog);
            try { sock.end(undefined); } catch {}
            waSessions.delete(phoneNumber);
            connectSession(phoneNumber);
        } else {
            try { await sock.sendPresenceUpdate('available'); } catch {} 
        }
    }, 120000);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (waSessions.get(phoneNumber) !== sock) return;
        
        socketLastActive.set(phoneNumber, Date.now());

        if (connection === 'open') {
            console.log(`✅ WhatsApp ${phoneNumber} Connected (Ultra Fast)`);
            handler(sock, {});
        }
        if (connection === 'close') {
            clearInterval(watchdog);
            const code = lastDisconnect?.error?.output?.statusCode;
            waSessions.delete(phoneNumber);
            if (code !== DisconnectReason.loggedOut) {
                console.log(`🔄 Reconnecting ${phoneNumber}...`);
                setTimeout(() => connectSession(phoneNumber), 5000);
            }
        }
    });

    return sock;
}

async function waPair(phoneNumber) {
    const number = String(phoneNumber).replace(/\D/g, '');
    if (!/^\d{8,15}$/.test(number)) throw new Error('Enter a valid number.');
    if (waSessions.has(number)) throw new Error('This number is already connected.');
    const dir = waUserDir(number);
    if (fs.existsSync(dir)) { await fsp.rm(dir, { recursive: true, force: true }); }

    let sock;
    try {
        sock = await connectSession(number);
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout')), 60000);
            const check = (u) => {
                if (u.qr) { clearTimeout(timeout); sock.ev.off('connection.update', check); resolve(); }
                if (u.connection === 'close') { clearTimeout(timeout); sock.ev.off('connection.update', check); reject(new Error('Closed')); }
            };
            sock.ev.on('connection.update', check);
        });
        const code = await sock.requestPairingCode(number);
        return { code };
    } catch (error) {
        if (waSessions.get(number) === sock) waSessions.delete(number);
        if (sock) { try { sock.end(undefined); } catch {} }
        throw error;
    }
}

async function waDisconnect(phoneNumber) {
    const number = String(phoneNumber).replace(/\D/g, '');
    const entry = waSessions.get(number);
    if (entry) { waSessions.delete(number); try { entry.end(undefined); } catch {} }
    await fsp.rm(waUserDir(number), { recursive: true, force: true });
    return 'Session deleted.';
}

async function restoreSessions() {
    try {
        const folders = await fsp.readdir(SESSION_ROOT);
        for (const f of folders) {
            const dir = path.join(SESSION_ROOT, f);
            if ((await fsp.stat(dir)).isDirectory()) {
                console.log(`Restoring ${f}...`);
                await connectSession(f);
            }
        }
    } catch (e) { console.log('No sessions to restore.'); }
}
restoreSessions();

// ================= TELEGRAM UI =================
bot.start(async (ctx) => {
    const welcome = `
☠️ <b>WELCOME TO DEATH CORE X</b> ☠️

<blockquote>To unlock device pairing, you must join our official community channels first!</blockquote>

1️⃣ Join our Telegram Group
2️⃣ Join our Telegram Channel

<i>After joining both, tap Verify Membership.</i>`;

    const opts = { parse_mode: 'HTML', reply_markup: { inline_keyboard: [
        [{ text: '📢 Join Channel', url: config.tgChannelUrl }, { text: '💬 Join Group', url: config.tgGroupUrl }],
        [{ text: '✅ Verify Membership', callback_data: 'verify_join' }]
    ]}};
    if (fs.existsSync('./bot.jpg')) {
        await ctx.replyWithPhoto({ source: './bot.jpg' }, { caption: welcome, ...opts }).catch(() => ctx.replyWithHTML(welcome, opts));
    } else { ctx.replyWithHTML(welcome, opts); }
    if (fs.existsSync('./bot.mp3')) { await ctx.replyWithAudio({ source: './bot.mp3' }).catch(() => {}); }
});

bot.action('verify_join', async (ctx) => {
    try { await ctx.answerCbQuery('Verification successful!'); } catch (err) { return; }
    await new Promise(resolve => setTimeout(resolve, 500));
    const verified = `
┏━━━━━━━━━━━━━━━━━━━━━┓
   ☠️ <b>𝐃𝐄𝐀𝐓𝐇 𝐂𝐎𝐑𝐄 𝐗</b> ☠️
┗━━━━━━━━━━━━━━━━━━━━━┛

╭━━〔 <b>𝐏𝐑𝐎 𝐂𝐎𝐍𝐓𝐑𝐎𝐋</b> 〕━━╮
┃ ⚡ <b>CORE</b>      : <i>DEATH CORE X</i> 🟢
┃ 🆔 <b>BUILD ID</b>  : <code>${config.version}</code>
┃ 👑 <b>OWNER</b>     : <i>${config.dev}</i>
┃ 🛡️ <b>STATUS</b>    : ✅ <b>Verified</b>
╰━━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 <b>𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒</b> 〕━━╮
┃ 📌 <code>/delsession</code> ➔ Delete Session
┃ 📌 <code>/runtime</code> ➔ Core Uptime
╰━━━━━━━━━━━━━━━━━━━━━╯

📥 <b>Send your WhatsApp number:</b>
👉 <code>2547XXXXXXX</code>`;
    try { await ctx.replyWithHTML(verified); } catch (error) { await ctx.reply(verified.replace(/<[^>]*>?/gm, '')).catch(() => {}); }
});

bot.on('text', async (ctx, next) => {
    const text = ctx.message.text.trim();
    if (text.startsWith('/')) return next();
    if (/^\d{8,15}$/.test(text)) {
        const waitMsg = await ctx.reply(`⏳ Requesting pairing code for +${text}...`);
        try {
            const result = await waPair(text);
            await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id).catch(() => {});
            const pairText = `
┏━━━━━━━━━━━━━━━━━━━━━┓
   🔐 <b>𝐏𝐀𝐈𝐑𝐈𝐍𝐆 𝐂𝐎𝐃𝐄</b> 🔐
┗━━━━━━━━━━━━━━━━━━━━━┛

╭━━〔 <b>𝐋𝐈𝐍𝐊𝐈𝐍𝐆 𝐂𝐎𝐃𝐄</b> 〕━━╮
┃      👉 <code>${result.code}</code> 👈
╰━━━━━━━━━━━━━━━━━━━━━╯

📱 <b>How to link:</b>
1️⃣ Open WhatsApp
2️⃣ Go to <b>Linked Devices</b>
3️⃣ Tap <b>Link a Device</b>
4️⃣ Choose <b>Link with phone number instead</b>
5️⃣ Enter the code above`;
            await ctx.replyWithHTML(pairText, { reply_markup: { inline_keyboard: [[{ text: "📋 Copy Pairing Code", copy_text: { text: result.code } }]] } });
        } catch (e) { 
            await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id).catch(() => {});
            await ctx.reply(`❌ <b>Error generating pairing code.</b>\nEnsure session is fresh.`, { parse_mode: 'HTML' }); 
        }
        return;
    }
    return next();
});

bot.on('new_chat_members', async (ctx) => {
    for (const member of ctx.message.new_chat_members) {
        if (member.id === bot.botInfo.id) continue;
        const groupName = ctx.chat.title || 'the group';
        
        let groupCount = 'N/A';
        let channelCount = 'N/A';
        try { groupCount = await ctx.telegram.getChatMembersCount(ctx.chat.id); } catch(e) {}
        try { const chat = await ctx.telegram.getChat(config.tgChannelUsername); channelCount = await ctx.telegram.getChatMembersCount(chat.id); } catch(e) {}

        const caption = `
☠️ <b>WELCOME TO ${groupName.toUpperCase()}</b> ☠️

<blockquote>We are glad to have you here, ${member.first_name}!</blockquote>

📊 <b>COMMUNITY STATS</b>
├ 👥 <b>Group Members:</b> ${groupCount}
└ 📢 <b>Channel Subscribers:</b> ${channelCount}

╭━━〔 <b>𝐁𝐎𝐓 𝐅𝐄𝐀𝐓𝐔𝐑𝐄𝐒</b> 〕━━╮
┃ 🛡️ <b>Ultra Secure & Fast</b>
┃ 🎵 <b>Music & Video Downloads</b>
┃ 🤖 <b>AI Chat, Img Generator</b>
┃ 👥 <b>Advanced Group Tools</b>
┃ 🎮 <b>Economy & Games</b>
┃ 🧠 <b>Memory Ai</b>
╰━━━━━━━━━━━━━━━━━━━━━╯

🔗 Pair the bot here: ${config.tgBotUrl}
📢 Channel: ${config.channelLink}`;

        if (fs.existsSync('./bot.jpg')) {
            await ctx.replyWithPhoto({ source: './bot.jpg' }, { caption, parse_mode: 'HTML' }).catch(() => {});
        } else {
            await ctx.replyWithHTML(caption);
        }
    }
});

bot.on('left_chat_member', async (ctx) => {
    const member = ctx.message.left_chat_member;
    if (member.id === bot.botInfo.id) return;

    const groupName = ctx.chat.title || 'the group';
    let groupCount = 'N/A';
    let channelCount = 'N/A';
    try { groupCount = await ctx.telegram.getChatMembersCount(ctx.chat.id); } catch(e) {}
    try { const chat = await ctx.telegram.getChat(config.tgChannelUsername); channelCount = await ctx.telegram.getChatMembersCount(chat.id); } catch(e) {}

    const caption = `
☠️ <b>GOODBYE</b> ☠️

<blockquote>@${member.username || member.first_name} has left ${groupName}.</blockquote>

📊 <b>COMMUNITY STATS</b>
├ 👥 <b>Remaining Group Members:</b> ${groupCount}
└ 📢 <b>Channel Subscribers:</b> ${channelCount}

🔗 Pair the bot here: ${config.tgBotUrl}
📢 Channel: ${config.channelLink}`;

    if (fs.existsSync('./bot.jpg')) {
        await ctx.replyWithPhoto({ source: './bot.jpg' }, { caption, parse_mode: 'HTML' }).catch(() => {});
    } else {
        await ctx.replyWithHTML(caption);
    }
});

bot.command('runtime', async (ctx) => {
    const up = process.uptime();
    const d = Math.floor(up / 86400), h = Math.floor((up % 86400) / 3600), m = Math.floor((up % 3600) / 60);
    await ctx.reply(`⏱️ <b>Bot Runtime:</b> ${d}d ${h}h ${m}m`, { parse_mode: 'HTML' });
});

bot.command('delsession', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (!args[0]) return ctx.reply('Usage: /delsession <number>');
    try { const res = await waDisconnect(args[0]); await ctx.reply(`✅ ${res}`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

bot.launch();
console.log('🤖 Ultra Isolated Multi-User Bot Initialized!');
