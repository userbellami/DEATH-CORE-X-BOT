const axios = require('axios');
module.exports = [
    { name: 'tiktok', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!a[0]) return r('Usage: .tiktok <url>');
        const loadingMsg = await s.sendMessage(f, { text: '⏳ *Fetching TikTok...*' }, { quoted: m });
        try {
            const { data } = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(a[0])}`);
            if (!data?.data?.play) throw new Error('No video');
            await s.sendMessage(f, { video: { url: data.data.play }, caption: '🎵 TikTok' }, { quoted: m });
        } catch (e) { 
            r('❌ ' + e.message); 
        } finally {
            await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {});
        }
    }},
    { name: 'ytmp3', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!a[0]) return r('Usage: .ytmp3 <youtube-url>');
        const loadingMsg = await s.sendMessage(f, { text: '⏳ *Downloading audio...*' }, { quoted: m });
        try {
            const { data } = await axios.get(`https://eliteprotech-apis.zone.id/download/ytmp3?url=${encodeURIComponent(a[0])}`, { timeout: 120000 });
            if (!data?.download?.downloadUrl) throw new Error('API failed');
            await s.sendMessage(f, { audio: { url: data.download.downloadUrl }, mimetype: 'audio/mpeg' }, { quoted: m });
        } catch (e) { 
            r('❌ ' + e.message); 
        } finally {
            await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {});
        }
    }}
];
