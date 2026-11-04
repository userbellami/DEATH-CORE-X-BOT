const axios = require('axios');
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
module.exports = [
    { name: 'orb', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => { if (!a.length) return r('Usage: .orb <question>'); r(`🔮 *ORB REVEALS*\n\n${pick(['Yes','No','Maybe','Definitely','Uncertain','Negative'])}`); }},
    { name: 'truth', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => { r(`💬 *INTERROGATION*\n\n${pick(['What is your biggest fear?','Who do you like?'])}`); }},
    { name: 'fact', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => { try { const { data } = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en'); r(`🧠 *DATA FRAGMENT*\n\n${data.text}`); } catch { r('❌'); } }},
    { name: 'define', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const word = a[0]; if (!word) return r('Usage: .define <word>');
        try { const { data } = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`); r(`📖 *${word}*\n\n${data[0]?.meanings?.[0]?.definitions?.[0]?.definition || 'Unknown.'}`); } catch { r('❌ Word not found.'); }
    }},
    { name: 'fancy', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const text = a.join(' ');
        if (!text) return r('Usage: .fancy <text>');
        const fancyText = text.replace(/[a-zA-Z]/g, (char) => {
            const code = char.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D400 + (code - 65));
            if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D41A + (code - 97));
            return char;
        });
        r(fancyText);
    }},
    { name: 'stalk', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const username = a[0];
        if (!username) return r('Usage: .stalk <github_username>');
        const loadingMsg = await s.sendMessage(f, { text: '🛰️ *Scanning target...*' }, { quoted: m });
        try {
            const { data } = await axios.get(`https://api.github.com/users/${username}`);
            const body = `👤 *GITHUB INTEL*\n\n🧑 *Name:* ${data.name || 'N/A'}\n🏷️ *Username:* @${data.login}\n📝 *Bio:* ${data.bio || 'N/A'}\n📦 *Repos:* ${data.public_repos}\n👥 *Followers:* ${data.followers}\n🔗 *URL:* ${data.html_url}`;
            await s.sendMessage(f, { image: { url: data.avatar_url }, caption: body }, { quoted: m });
        } catch (e) { r('❌ Target not found.'); }
        finally { await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {}); }
    }},
    { name: 'npm', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const pkg = a[0];
        if (!pkg) return r('Usage: .npm <package_name>');
        const loadingMsg = await s.sendMessage(f, { text: '🛰️ *Querying NPM grid...*' }, { quoted: m });
        try {
            const { data } = await axios.get(`https://registry.npmjs.org/${pkg}`);
            const latest = data['dist-tags'].latest;
            const body = `📦 *NPM DATA*\n\n🏷️ *Name:* ${data.name}\n📝 *Desc:* ${data.description || 'N/A'}\n🔢 *Version:* ${latest}\n🔗 *URL:* https://www.npmjs.com/package/${data.name}`;
            r(body);
        } catch (e) { r('❌ Package not found.'); }
        finally { await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {}); }
    }},
    { name: 'ssweb', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const url = a.join(' ');
        if (!url) return r('Usage: .ssweb https://google.com');
        const loadingMsg = await s.sendMessage(f, { text: '📸 *Capturing visual intel...*' }, { quoted: m });
        try {
            const ssUrl = `https://image.thum.io/get/width/800/crop/1200/${encodeURIComponent(url)}`;
            await s.sendMessage(f, { image: { url: ssUrl }, caption: `📸 Visual intel of ${url}` }, { quoted: m });
        } catch (e) { r('❌ ' + e.message); }
        finally { await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {}); }
    }}
];
