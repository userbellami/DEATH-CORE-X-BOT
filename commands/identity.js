const os = require('os');
const axios = require('axios');

module.exports = [
    { name: 'ping', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const start = Date.now();
        await s.sendMessage(f, { text: '🏓 Pinging...' });
        r(`🏓 *Pong!*\n⚡ ${Date.now() - start} ms`);
    }},
    { name: 'core', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        r(`✅ *DEATH CORE X is ALIVE*\n\n🟢 Uptime: ${Math.floor(process.uptime() / 60)}m\n🧠 Owner: ${c.dev}`);
    }},
    { name: 'uptime', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const up = process.uptime();
        r(`⏱️ *Runtime:* ${Math.floor(up / 3600)}h ${Math.floor((up % 3600) / 60)}m ${Math.floor(up % 60)}s`);
    }},
    { name: 'admin', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        r(`👑 *Owner:* ${c.dev}\n📞 ${c.devNumber}`);
    }},
    { name: 'jid', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        r(`🆔 JID: \`${f}\``);
    }},
    { name: 'lyrics', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const query = a.join(' ');
        if (!query) return r('Usage: .lyrics <song>');
        const loadingMsg = await s.sendMessage(f, { text: '🎵 *Searching lyrics...*' }, { quoted: m });
        try {
            const { data } = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(query.split(' - ')[0])}/${encodeURIComponent(query.split(' - ')[1] || query)}`);
            r((data.lyrics || 'No lyrics.').slice(0, 3500));
        } catch { 
            r('❌ Lyrics not found.'); 
        } finally {
            await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {});
        }
    }},
    { name: 'script', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        r(`📜 *DEATH CORE X*\n\n🔗 Repo: https://github.com/userbellami/DEATH-CORE-X-BOT\n📢 Channel: ${c.channelLink}`);
    }}
];
