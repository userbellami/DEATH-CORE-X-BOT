const axios = require('axios');
const yts = require('yt-search');

const playHandler = async (sock, msg, from, args, config, reply, cmdName) => {
    const text = args.join(' ');
    if (!text) return reply(`*Example:* ${config.prefix}${cmdName} Faded by Alan Walker`);
    
    const loadingMsg = await sock.sendMessage(from, { text: '⏳ *Initializing Stream Protocol...*' }, { quoted: msg });
    
    try {
        await sock.sendMessage(from, { react: { text: '🎵', key: msg.key } }).catch(() => {});
        let video, videoUrl;
        
        if (text.includes('youtu')) {
            videoUrl = text;
            video = (await yts({ videoId: text.split('v=')[1] || text.split('/').pop() }));
        } else {
            const search = await yts(text);
            if (!search.videos.length) throw new Error('Data not found.');
            video = search.videos[0];
            videoUrl = video.url;
        }

        const durationParts = (video.timestamp || '0:00').split(':');
        let totalMinutes = 0;
        if (durationParts.length === 3) totalMinutes = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);
        else if (durationParts.length === 2) totalMinutes = parseInt(durationParts[0]);

        if (totalMinutes > 15) {
            throw new Error(`File exceeds 15 min limit (${video.timestamp}).`);
        }
        
        const body = `╭━━━━━━━━━\n┃ 𝐃𝐄ΛΤ𝐇 𝐂𝐎𝐑Ξ 𝐗 - CORE STREAM\n\n> ᴛɪᴛʟᴇ: ${video.title}\n\n┃ ᴠɪᴇᴡꜱ: ${video.views || 0}\n┃ ᴅᴜʀᴀᴛɪᴏɴ: ${video.timestamp || '-'}\n┃ ᴜᴘʟᴏᴀᴅᴇᴅ: ${video.ago || '-'}\n\n┃ Downloading stream... ☠️\n╰━━━━━━━━━━━━━━━━━━┈⊷\n\n> POWERED BY LORD MONK©`;
        await sock.sendMessage(from, { image: { url: video.thumbnail }, caption: body }, { quoted: msg }).catch(() => {});
        
        let downloadUrl;
        try {
            const apiUrl = `https://eliteprotech-apis.zone.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });
            downloadUrl = data?.download?.downloadUrl;
        } catch (e) {
            const backupApi = `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(videoUrl)}`;
            const { data } = await axios.get(backupApi, { timeout: 60000 });
            downloadUrl = data?.result?.download?.url;
        }

        if (!downloadUrl) throw new Error('Stream servers offline.');
        
        await sock.sendMessage(from, { 
            audio: { url: downloadUrl }, 
            mimetype: 'audio/mpeg', 
            fileName: `${(video.title || 'audio').replace(/[\\/:*?"<>|]/g,'_')}.mp3` 
        }, { quoted: msg }).catch((err) => {
            throw new Error('File payload too large.');
        });
        
        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) { 
        reply(`❌ *Protocol Failed:* ${e.message}`); 
    } finally {
        await sock.sendMessage(from, { delete: loadingMsg.key }).catch(() => {});
    }
};

module.exports = [
    { name: 'stream', execute: (s,m,f,a,g,o,c,st,_n,sv,r) => playHandler(s,m,f,a,c,r,'stream') },
    { name: 'audio', execute: (s,m,f,a,g,o,c,st,_n,sv,r) => playHandler(s,m,f,a,c,r,'audio') }
];
