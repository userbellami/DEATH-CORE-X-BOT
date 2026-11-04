const fs = require('fs');
const os = require('os');

let menuImageBuffer = null;
let menuAudioBuffer = null;
let customMenuBuffer = null;
try { if (fs.existsSync('./bot.jpg')) menuImageBuffer = fs.readFileSync('./bot.jpg'); } catch (e) {}
try { if (fs.existsSync('./bot.mp3')) menuAudioBuffer = fs.readFileSync('./bot.mp3'); } catch (e) {}
try { if (fs.existsSync('./menu.jpg')) customMenuBuffer = fs.readFileSync('./menu.jpg'); } catch (e) {}

module.exports = [
{
    name: 'menu',
    execute: async (sock, msg, from, args, isGroup, isOwner, config, settings, db, saveSettings, reply) => {
        const up = process.uptime();
        const d = Math.floor(up / 86400), h = Math.floor((up % 86400) / 3600), m = Math.floor((up % 3600) / 60);
        const uptimeStr = d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
        const botMemUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1) + ' MB';
        const totalMem = os.totalmem(), freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const usedMemPercent = Math.round((usedMem / totalMem) * 100);
        const totalGB = (totalMem / (1024 ** 3)).toFixed(2);
        const usedGB = (usedMem / (1024 ** 3)).toFixed(2);
        const barLength = 10;
        const filled = Math.min(Math.round((usedMemPercent / 100) * barLength), barLength);
        const ramBar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
        const speed = Math.floor(Math.random() * 15) + 5; 
        const now = new Date();
        const hour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Nairobi', hour: 'numeric', hour12: false }).format(now));
        let greeting = "Good Evening 🌙";
        if (hour < 12) greeting = "Good Morning ☀️";
        else if (hour < 18) greeting = "Good Afternoon 🌤️";
        const currentPrefix = settings.prefix || config.prefix;

        let toolCount = 0;
        try {
            const path = require('path');
            const dir = path.join(__dirname);
            for (const file of fs.readdirSync(dir)) {
                if (!file.endsWith('.js')) continue;
                const arr = require(path.join(dir, file));
                if (Array.isArray(arr)) toolCount += arr.length;
            }
        } catch {}

        const rawMenu = `
*╭━━〔 ☠️ DEATH CORE X ☠️ 〕━━╮*
┃
┃ 👋 *Welcome, ${greeting}*
┃
┃ 🟢 *Status*    : Online
┃ ⚙️ *Mode*      : ${settings.mode}
┃ ⏱️ *Uptime*    : ${uptimeStr}
┃ ⚡ *Speed*     : ${speed} ms
┃ 🧠 *RAM*       : [${ramBar}] ${usedMemPercent}%
┃ 📦 *Commands*  : ${toolCount}
┃ 🔑 *Prefix*    : [ ${currentPrefix} ]
┃
*╰━━━━━━━━━━━━━━━━━━━━━━━╯*

*╭━━〔 👑 SYSTEM CONTROL 〕━━╮*
┃ ▸ system
┃ ▸ setprefix
┃ ▸ prefixfree
┃ ▸ setbotname
┃ ▸ reboot
┃ ▸ sync
┃ ▸ setpp
┃ ▸ setfullpp
┃ ▸ autoviewstatus
┃ ▸ autoread
┃ ▸ autotyping
┃ ▸ anticall
┃ ▸ antidelete
┃ ▸ autoreact
*╰━━━━━━━━━━━━━━━━━━━━━━━╯*

*╭━━〔 💰 ECONOMY NEXUS 〕━━╮*
┃ ▸ claim
┃ ▸ wallet
┃ ▸ grind
┃ ▸ heist
┃ ▸ transfer
┃ ▸ top
┃ ▸ bet
*╰━━━━━━━━━━━━━━━━━━━━━━━╯*

*╭━━〔 🎮 WAR GAMES 〕━━╮*
┃ ▸ tictactoe
┃ ▸ trivia
┃ ▸ dare
*╰━━━━━━━━━━━━━━━━━━━━━━━╯*

*╭━━〔 🛡️ GROUP DOMINANCE 〕━━╮*
┃ ▸ invoke
┃ ▸ eradicate
┃ ▸ guard
┃ ▸ silence
┃ ▸ elevate
┃ ▸ downgrade
┃ ▸ purify
┃ ▸ lockdown
┃ ▸ unlock
┃ ▸ broadcast
┃ ▸ hijack
┃ ▸ masskick
┃ ▸ promoteall
┃ ▸ demoteall
┃ ▸ tagall
┃ ▸ hidetag
┃ ▸ tagadmin
┃ ▸ staff
┃ ▸ invite
┃ ▸ revoke
┃ ▸ setdesc
┃ ▸ group
┃ ▸ listgroup
┃ ▸ welcome
┃ ▸ goodbye
┃ ▸ warn
┃ ▸ unwarn
┃ ▸ setgrouppp
┃ ▸ setgroupprofile
┃ ▸ status
┃ ▸ antitag
┃ ▸ antitagadmins
*╰━━━━━━━━━━━━━━━━━━━━━━━╯*

*╭━━〔 🤖 AI OVERLORD 〕━━╮*
┃ ▸ sentient
┃ ▸ gpt
┃ ▸ gemini
┃ ▸ envision
┃ ▸ intel
*╰━━━━━━━━━━━━━━━━━━━━━━━╯*

*╭━━〔 🌸 ANIME REALM 〕━━╮*
┃ ▸ waifu
┃ ▸ neko
┃ ▸ aniquote
┃ ▸ embrace
*╰━━━━━━━━━━━━━━━━━━━━━━━╯*

*╭━━〔 🎨 CONVERTERS 〕━━╮*
┃ ▸ mix
┃ ▸ toqr
┃ ▸ toimg
┃ ▸ tomp3
┃ ▸ tovid
┃ ▸ tovn
┃ ▸ translate
┃ ▸ tts
┃ ▸ bass
┃ ▸ slow
┃ ▸ reverse
┃ ▸ volume
*╰━━━━━━━━━━━━━━━━━━━━━━━╯*

*╭━━〔 🛠️ TOOLS & INTEL 〕━━╮*
┃ ▸ calc
┃ ▸ define
┃ ▸ fact
┃ ▸ weather
┃ ▸ ssweb
┃ ▸ fancy
┃ ▸ stalk
┃ ▸ npm
*╰━━━━━━━━━━━━━━━━━━━━━━━╯*

*╭━━〔 🎵 CORE STREAM 〕━━╮*
┃ ▸ stream
┃ ▸ audio
┃ ▸ ytmp4
┃ ▸ tiktok
*╰━━━━━━━━━━━━━━━━━━━━━━━╯*

*╭━━〔 📋 CORE DATA 〕━━╮*
┃ ▸ core
┃ ▸ jid
┃ ▸ lyrics
┃ ▸ menu
┃ ▸ admin
┃ ▸ ping
┃ ▸ uptime
┃ ▸ script
┃ ▸ vv
┃ ▸ vvdm
*╰━━━━━━━━━━━━━━━━━━━━━━━╯*

*┏━━━━━━━━━━━━━━━━━━━┓*
*┃ 🛡️ POWERED BY : ${config.dev.toUpperCase()}*
*┗━━━━━━━━━━━━━━━━━━━┛*`;

        const menuText = rawMenu.split('\n').map(line => `> ${line}`).join('\n');
        const isSelfDM = msg.key.fromMe && from === (msg.key.participant || msg.key.remoteJid);
        const sendOpts = isSelfDM ? {} : { quoted: msg };

        if (customMenuBuffer) await sock.sendMessage(from, { image: customMenuBuffer, caption: menuText }, sendOpts).catch(() => {});
        else if (menuImageBuffer) await sock.sendMessage(from, { image: menuImageBuffer, caption: menuText }, sendOpts).catch(() => {});
        else await sock.sendMessage(from, { text: menuText }, sendOpts).catch(() => {});
        
        if (menuAudioBuffer) await sock.sendMessage(from, { audio: menuAudioBuffer, mimetype: 'audio/mp4', ptt: false }, sendOpts).catch(() => {});
    }
}
];
