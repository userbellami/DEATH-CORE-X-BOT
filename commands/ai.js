const axios = require('axios');

module.exports = [
    { name: 'sentient', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        const prompt = a.join(' ');
        if (!prompt) return r('Usage: .sentient <question>');
        const sender = m.key.participant || m.key.remoteJid;
        
        const loadingMsg = await s.sendMessage(f, { text: '🤖 *Thinking...*' }, { quoted: m });
        
        try {
            const memory = db.prepare('SELECT history FROM chat_memory WHERE jid = ?').get(sender);
            let historyText = memory ? memory.history : '';
            const fullPrompt = `You are Death Core X bot. Keep answers short.\nPast Conversation: ${historyText}\nUser: ${prompt}\nAI:`;
            const { data } = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`, { timeout: 60000 });
            const response = typeof data === 'string' ? data : JSON.stringify(data);
            
            const newHistory = `${historyText}\nUser: ${prompt}\nAI: ${response}`.split('\n').slice(-6).join('\n');
            db.prepare('INSERT INTO chat_memory (jid, history) VALUES (?, ?) ON CONFLICT(jid) DO UPDATE SET history = ?').run(sender, newHistory, newHistory);
            
            r(response.slice(0, 3500));
        } catch (e) { 
            r('❌ ' + e.message); 
        } finally {
            await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {});
        }
    }},
    { name: 'gpt', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        if (!a.length) return r('Usage: .gpt <question>');
        const loadingMsg = await s.sendMessage(f, { text: '🤖 *Thinking...*' }, { quoted: m });
        try {
            const { data } = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(a.join(' '))}`, { timeout: 60000 });
            r(data.slice(0, 3500));
        } catch (e) { 
            r('❌ ' + e.message); 
        } finally {
            await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {});
        }
    }},
    { name: 'gemini', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        if (!a.length) return r('Usage: .gemini <question>');
        const loadingMsg = await s.sendMessage(f, { text: '💎 *Thinking...*' }, { quoted: m });
        try {
            const { data } = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(a.join(' '))}`, { timeout: 60000 });
            r(data.slice(0, 3500));
        } catch (e) { 
            r('❌ ' + e.message); 
        } finally {
            await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {});
        }
    }},
    { name: 'intel', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        const q = a.join(' ');
        if (!q) return r('Usage: .intel <query>');
        const loadingMsg = await s.sendMessage(f, { text: '🔎 *Searching...*' }, { quoted: m });
        try {
            const res = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1`);
            const ans = res.data.AbstractText || res.data.RelatedTopics?.[0]?.Text || 'No results.';
            r(`🔎 *${q}*\n\n${ans}`);
        } catch (e) { 
            r('❌ ' + e.message); 
        } finally {
            await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {});
        }
    }}
];
