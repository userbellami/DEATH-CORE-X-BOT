const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const yts = require('yt-search');
const axios = require('axios');

module.exports = [
    { name: 'ytmp4', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        const text = a.join(' ');
        if (!text) return r('Usage: .ytmp4 <url or search>');
        const loadingMsg = await s.sendMessage(f, { text: '⏳ *Fetching video from API...*' }, { quoted: m });
        
        try {
            let videoUrl = text;
            let videoTitle = 'Video';
            
            if (!text.includes('youtu')) {
                const search = await yts(text);
                if (!search.videos.length) throw new Error('Video not found.');
                videoUrl = search.videos[0].url;
                videoTitle = search.videos[0].title;
            } else {
                const search = await yts({ videoId: text.split('v=')[1] || text.split('/').pop() });
                if(search) videoTitle = search.title;
            }

            const apiUrl = `https://eliteprotech-apis.zone.id/download/ytmp4?url=${encodeURIComponent(videoUrl)}`;
            const { data } = await axios.get(apiUrl, { timeout: 120000 });
            
            if (!data?.status || !data?.download?.downloadUrl) throw new Error('API failed to fetch video.');
            
            await s.sendMessage(f, { video: { url: data.download.downloadUrl }, caption: `🎬 *${videoTitle}*\nDownloaded directly!` }, { quoted: m });
            
        } catch (e) { 
            r('❌ Error: ' + e.message); 
        } finally {
            await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {});
        }
    }},
    { name: 'sticker', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isVideo = m.message?.videoMessage || quoted?.videoMessage;
        const isImage = m.message?.imageMessage || quoted?.imageMessage;
        if (!isVideo && !isImage) return r('Reply to a video or image with .sticker');
        
        const loadingMsg = await s.sendMessage(f, { text: '🎨 *Creating sticker...*' }, { quoted: m });
        
        try {
            const { downloadMediaMessage } = require('@whiskeysockets/baileys');
            const buf = await downloadMediaMessage({ message: isVideo ? { videoMessage: isVideo } : { imageMessage: isImage }, key: m.key }, 'buffer', {});
            const tempIn = path.join(__dirname, `../in_${Date.now()}`);
            const tempOut = path.join(__dirname, `../out_${Date.now()}.webp`);
            fs.writeFileSync(tempIn, buf);
            let ffmpegCmd = isVideo 
                ? `ffmpeg -i ${tempIn} -t 3 -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0,format=rgba,geq='if(gt(hypot(X-W/2,Y-H/2),W/2),0,alpha(X,Y))'" -c:v libwebp -lossless 0 -q:v 75 -loop 0 ${tempOut}`
                : `ffmpeg -i ${tempIn} -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0,format=rgba,geq='if(gt(hypot(X-W/2,Y-H/2),W/2),0,alpha(X,Y))'" -c:v libwebp ${tempOut}`;
            exec(ffmpegCmd, async (err) => {
                if (err) { fs.unlinkSync(tempIn); return r('❌ FFmpeg failed. Is it installed on the panel?'); }
                await s.sendMessage(f, { sticker: fs.readFileSync(tempOut) }, { quoted: m });
                fs.unlinkSync(tempIn); fs.unlinkSync(tempOut);
            });
        } catch (e) { 
            r('❌ ' + e.message); 
        } finally {
            await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {});
        }
    }},
    { name: 'toaudio', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const video = m.message?.videoMessage || quoted?.videoMessage;
        const audio = m.message?.audioMessage || quoted?.audioMessage;
        if (!video && !audio) return r('Reply to video/audio with .toaudio');
        try {
            const key = video ? 'videoMessage' : 'audioMessage';
            const { downloadMediaMessage } = require('@whiskeysockets/baileys');
            const buf = await downloadMediaMessage({ message: { [key]: video || audio }, key: m.key }, 'buffer', {});
            await s.sendMessage(f, { audio: buf, mimetype: 'audio/mp4' }, { quoted: m });
        } catch (e) { r('❌ ' + e.message); }
    }}
];
