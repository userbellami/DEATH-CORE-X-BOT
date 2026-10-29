const axios = require('axios');
module.exports = [
    { name: 'envision', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const prompt = a.join(' ');
        if (!prompt) return r('Usage: .envision <prompt>');
        const loadingMsg = await s.sendMessage(f, { text: '🎨 *Generating visual...*' }, { quoted: m });
        try {
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&nologo=true`;
            await s.sendMessage(f, { image: { url }, caption: `🎨 ${prompt}` }, { quoted: m });
        } catch (e) { 
            r('❌ ' + e.message); 
        } finally {
            await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {});
        }
    }}
];
