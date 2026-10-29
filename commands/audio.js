const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const processAudio = async (s, m, f, a, g, o, c, st, db, sv, r, effect) => {
    const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const audio = m.message?.audioMessage || q?.audioMessage;
    const video = m.message?.videoMessage || q?.videoMessage;
    
    if (!audio && !video) return r('Reply to an audio or video message with this command.');
    
    const loadingMsg = await s.sendMessage(f, { text: `⏳ *Applying ${effect}...*` }, { quoted: m });
    
    try {
        const key = audio ? 'audioMessage' : 'videoMessage';
        const buf = await downloadMediaMessage({ message: { [key]: audio || video }, key: m.key }, 'buffer', {});
        
        const tempIn = path.join(__dirname, `../in_${Date.now()}`);
        const tempOut = path.join(__dirname, `../out_${Date.now()}.mp3`);
        fs.writeFileSync(tempIn, buf);
        
        let cmd = '';
        if (effect === 'bass') cmd = `ffmpeg -i ${tempIn} -af "bass=g=15" -y ${tempOut}`;
        if (effect === 'slow') cmd = `ffmpeg -i ${tempIn} -filter:a "atempo=0.8" -y ${tempOut}`;
        if (effect === 'reverse') cmd = `ffmpeg -i ${tempIn} -filter_complex "areverse" -y ${tempOut}`;
        if (effect === 'volume') cmd = `ffmpeg -i ${tempIn} -filter:a "volume=2.0" -y ${tempOut}`;
        
        exec(cmd, async (err) => {
            if (err) { fs.unlinkSync(tempIn); return r('❌ FFmpeg failed. Is it installed?'); }
            await s.sendMessage(f, { audio: fs.readFileSync(tempOut), mimetype: 'audio/mpeg' }, { quoted: m });
            fs.unlinkSync(tempIn); fs.unlinkSync(tempOut);
        });
    } catch (e) { 
        r('❌ Failed to process audio.'); 
    } finally {
        await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {});
    }
};

module.exports = [
    { name: 'bass', execute: (s,m,f,a,g,o,c,st,db,sv,r) => processAudio(s,m,f,a,g,o,c,st,db,sv,r,'bass') },
    { name: 'slow', execute: (s,m,f,a,g,o,c,st,db,sv,r) => processAudio(s,m,f,a,g,o,c,st,db,sv,r,'slow') },
    { name: 'reverse', execute: (s,m,f,a,g,o,c,st,db,sv,r) => processAudio(s,m,f,a,g,o,c,st,db,sv,r,'reverse') },
    { name: 'volume', execute: (s,m,f,a,g,o,c,st,db,sv,r) => processAudio(s,m,f,a,g,o,c,st,db,sv,r,'volume') }
];
