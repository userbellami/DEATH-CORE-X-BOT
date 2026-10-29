const fs = require('fs');
const axios = require('axios');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const q = (m) => m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

module.exports = [
    { name: 'calc', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const expression = a.join(' ');
        if (!expression) return r('Usage: .calc 5 * 5');
        try {
            const result = eval(expression); 
            r(`🧮 *Math:* ${expression}\n*Result:* ${result}`);
        } catch { r('❌ Invalid math expression.'); }
    }},
    { name: 'weather', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const city = a.join(' ');
        if (!city) return r('Usage: .weather Nairobi');
        const loadingMsg = await s.sendMessage(f, { text: '🌍 *Fetching weather...*' }, { quoted: m });
        try {
            const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
            const cur = data.current_condition[0];
            r(`🌡️ *Weather in ${city}*\n\n🌡️ Temp: ${cur.temp_C}°C\n☁️ Condition: ${cur.weatherDesc[0].value}\n💧 Humidity: ${cur.humidity}%\n💨 Wind: ${cur.windspeedKmph} km/h`);
        } catch (e) { 
            r('❌ City not found or API error.'); 
        } finally {
            await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {});
        }
    }},
    { name: 'toqr', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const text = a.join(' ');
        if (!text) return r('Usage: .toqr <text>');
        try {
            const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;
            await s.sendMessage(f, { image: { url }, caption: `🔳 QR Code for: ${text}` }, { quoted: m });
        } catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'ssweb', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const url = a.join(' ');
        if (!url) return r('Usage: .ssweb https://google.com');
        const loadingMsg = await s.sendMessage(f, { text: '📸 *Taking Screenshot...*' }, { quoted: m });
        try {
            const ssUrl = `https://image.thum.io/get/width/800/crop/1200/${encodeURIComponent(url)}`;
            await s.sendMessage(f, { image: { url: ssUrl }, caption: `📸 Screenshot of ${url}` }, { quoted: m });
        } catch (e) { 
            r('❌ ' + e.message); 
        } finally {
            await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {});
        }
    }},
    { name: 'toimg', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const qMsg = q(m);
        if (!qMsg?.stickerMessage) return r('Reply to a sticker with .toimg');
        try {
            const buf = await downloadMediaMessage({ message: { stickerMessage: qMsg.stickerMessage }, key: m.key }, 'buffer', {});
            await s.sendMessage(f, { image: buf, caption: '🖼️ Converted' }, { quoted: m });
        } catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'tovid', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const qMsg = q(m);
        if (!qMsg?.stickerMessage) return r('Reply to a sticker with .tovid');
        try {
            const buf = await downloadMediaMessage({ message: { stickerMessage: qMsg.stickerMessage }, key: m.key }, 'buffer', {});
            await s.sendMessage(f, { video: buf, caption: '🎬 Video' }, { quoted: m });
        } catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'tovn', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const qMsg = q(m);
        const video = m.message?.videoMessage || qMsg?.videoMessage;
        const audio = m.message?.audioMessage || qMsg?.audioMessage;
        if (!video && !audio) return r('Reply to audio/video with .tovn');
        try {
            const key = video ? 'videoMessage' : 'audioMessage';
            const buf = await downloadMediaMessage({ message: { [key]: video || audio }, key: m.key }, 'buffer', {});
            await s.sendMessage(f, { audio: buf, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m });
        } catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'vv', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const qMsg = q(m);
        const vo = qMsg?.viewOnceMessageV2?.message || qMsg?.viewOnceMessage?.message;
        if (!vo) return r('Reply to a view-once message.');
        
        try {
            const keyType = Object.keys(vo)[0];
            const isImage = keyType === 'imageMessage';
            const { downloadMediaMessage } = require('@whiskeysockets/baileys');
            const buf = await downloadMediaMessage({ message: vo, key: m.key }, 'buffer', {});
            
            const sendOptions = isImage 
                ? { image: buf, caption: '🔓 Revealed (Not View Once)' }
                : { video: buf, caption: '🔓 Revealed (Not View Once)' };
                
            await s.sendMessage(f, sendOptions, { quoted: m });
        } catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'vvdm', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const qMsg = q(m);
        const vo = qMsg?.viewOnceMessageV2?.message || qMsg?.viewOnceMessage?.message;
        if (!vo) return r('Reply to a view-once message.');
        
        try {
            const keyType = Object.keys(vo)[0];
            const isImage = keyType === 'imageMessage';
            const { downloadMediaMessage } = require('@whiskeysockets/baileys');
            const buf = await downloadMediaMessage({ message: vo, key: m.key }, 'buffer', {});
            
            const sendOptions = isImage 
                ? { image: buf, caption: '🔓 Revealed (DM)' }
                : { video: buf, caption: '🔓 Revealed (DM)' };
                
            await s.sendMessage(f, sendOptions, { quoted: m });
        } catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'mix', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!a[0]) return r('Usage: .mix 😂 😍');
        const [e1, e2] = a;
        try {
            const res = await axios.get(`https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&q=${encodeURIComponent(e1 + e2)}&limit=1`);
            if (res.data.results?.[0]?.media_formats?.gif?.url) {
                await s.sendMessage(f, { image: { url: res.data.results[0].media_formats.gif.url }, caption: `${e1} + ${e2}` }, { quoted: m });
            } else r('❌ No mix found.');
        } catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'toqr', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const text = a.join(' ');
        if (!text) return r('Usage: .toqr <text>');
        try {
            const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;
            await s.sendMessage(f, { image: { url }, caption: '🔳 QR' }, { quoted: m });
        } catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'translate', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const text = a.join(' ');
        if (!text) return r('Usage: .translate <text>');
        try {
            const res = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|sw`);
            r(`🌐 ${res.data.responseData.translatedText}`);
        } catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'tts', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const text = a.join(' ');
        if (!text) return r('Usage: .tts <text>');
        try {
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
            await s.sendMessage(f, { audio: { url }, mimetype: 'audio/mpeg', ptt: false }, { quoted: m });
        } catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'tomp3', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const qMsg = q(m);
        const video = m.message?.videoMessage || qMsg?.videoMessage;
        if (!video) return r('Reply to a video with .tomp3');
        try {
            const buf = await downloadMediaMessage({ message: { videoMessage: video }, key: m.key }, 'buffer', {});
            await s.sendMessage(f, { audio: buf, mimetype: 'audio/mpeg', fileName: 'audio.mp3' }, { quoted: m });
        } catch (e) { r('❌ ' + e.message); }
    }}
];
