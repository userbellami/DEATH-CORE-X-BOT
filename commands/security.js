const spamTracker = new Map();

module.exports = [
    { name: '__security', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        if (!g) return;
        const sender = m.key.participant || m.key.remoteJid;
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        if (!body) return;

        if (st['activeTrivia_' + f] && body.toLowerCase().includes(st['activeTrivia_' + f])) {
            delete st['activeTrivia_' + f]; sv();
            let user = db.prepare('SELECT wallet FROM users WHERE jid = ?').get(sender);
            if (!user) { db.prepare('INSERT INTO users (jid, wallet) VALUES (?, ?)').run(sender, 200); }
            else { db.prepare('UPDATE users SET wallet = wallet + ? WHERE jid = ?').run(200, sender); }
            await s.sendMessage(f, { text: `🎉 *CORRECT!* @${sender.split('@')[0]} won *200 credits*!`, mentions: [sender] }, { quoted: m });
            return;
        }

        const gs = st[f] || {};
        const isUserAdmin = (await s.groupMetadata(f)).participants.find(p => p.id === sender)?.admin;
        if (o || isUserAdmin || m.key.fromMe) return;
        
        if (gs.guard && /(chat\.whatsapp\.com|wa\.me|https?:\/\/)/i.test(body)) {
            await s.sendMessage(f, { delete: m.key });
            await r(`⚠️ @${sender.split('@')[0]} links are not allowed here!`, { mentions: [sender] });
        }

        const now = Date.now();
        if (!spamTracker.has(sender)) spamTracker.set(sender, []);
        const times = spamTracker.get(sender).filter(t => now - t < 3000);
        times.push(now);
        spamTracker.set(sender, times);
        if (times.length >= 5) {
            await s.groupParticipantsUpdate(f, [sender], 'remove');
            await r(`🚫 @${sender.split('@')[0]} was kicked for spamming!`, { mentions: [sender] });
            spamTracker.delete(sender);
        }
    }},
    { name: 'warn', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        if (!g) return r('Group only.');
        const target = m.message?.extendedTextMessage?.contextInfo?.participant || (a[0] ? a[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
        if (!target) return r('Reply to a message to warn.');
        const user = db.prepare('SELECT warns FROM users WHERE jid = ?').get(target) || { warns: 0 };
        const newWarns = user.warns + 1;
        if (newWarns >= 3) {
            await s.groupParticipantsUpdate(f, [target], 'remove');
            db.prepare('UPDATE users SET warns = 0 WHERE jid = ?').run(target);
            r(`🚫 @${target.split('@')[0]} reached 3 warns and was kicked!`, { mentions: [target] });
        } else {
            db.prepare('INSERT INTO users (jid, warns) VALUES (?, ?) ON CONFLICT(jid) DO UPDATE SET warns = ?').run(target, newWarns, newWarns);
            r(`⚠️ @${target.split('@')[0]} has been warned! (${newWarns}/3)`, { mentions: [target] });
        }
    }},
    { name: 'unwarn', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        if (!g) return r('Group only.');
        const target = m.message?.extendedTextMessage?.contextInfo?.participant || (a[0] ? a[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
        if (!target) return r('Reply to a message to unwarn.');
        db.prepare('UPDATE users SET warns = 0 WHERE jid = ?').run(target);
        r(`✅ Warnings cleared for @${target.split('@')[0]}`, { mentions: [target] });
    }}
];
