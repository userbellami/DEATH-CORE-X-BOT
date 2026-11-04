const fs = require('fs');

module.exports = [
    { name: 'claim', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        const sender = m.key.participant || m.key.remoteJid;
        const now = Date.now();
        const user = db.prepare('SELECT * FROM users WHERE jid = ?').get(sender);
        if (user && now - user.last_daily < 86400000) {
            const hours = Math.ceil((86400000 - (now - user.last_daily)) / 3600000);
            return r(`⏳ Cooldown active! Return in ${hours} hours.`);
        }
        const amount = 500;
        if (!user) db.prepare('INSERT INTO users (jid, wallet, last_daily) VALUES (?, ?, ?)').run(sender, amount, now);
        else db.prepare('UPDATE users SET wallet = wallet + ?, last_daily = ? WHERE jid = ?').run(amount, now, sender);
        r(`🎁 *SUPPLY DROP CLAIMED!*\n\nReceived *${amount} credits*.`);
    }},
    { name: 'wallet', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        const sender = m.key.participant || m.key.remoteJid;
        const user = db.prepare('SELECT wallet FROM users WHERE jid = ?').get(sender);
        const bal = user ? user.wallet : 0;
        r(`💰 *CREDIT VAULT*\n\n👤 Operative: @${sender.split('@')[0]}\n🪙 Balance: *${bal} credits*`, { mentions: [sender] });
    }},
    { name: 'grind', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        const sender = m.key.participant || m.key.remoteJid;
        const amount = Math.floor(Math.random() * 150) + 50;
        let user = db.prepare('SELECT wallet FROM users WHERE jid = ?').get(sender);
        if (!user) { db.prepare('INSERT INTO users (jid, wallet) VALUES (?, ?)').run(sender, amount); }
        else { db.prepare('UPDATE users SET wallet = wallet + ? WHERE jid = ?').run(amount, sender); }
        r(`⚙️ *GRIND SUCCESSFUL*\n\nEarned *${amount} credits*.`);
    }},
    { name: 'heist', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        if (!g) return r('This command can only be used in groups.');
        const sender = m.key.participant || m.key.remoteJid;
        const target = m.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return r('Reply to the target you want to heist!');
        if (target === sender) return r('❌ Cannot heist yourself.');

        const targetUser = db.prepare('SELECT wallet FROM users WHERE jid = ?').get(target);
        const targetBal = targetUser ? targetUser.wallet : 0;
        if (targetBal < 100) return r('❌ Target is too poor.');

        const user = db.prepare('SELECT wallet FROM users WHERE jid = ?').get(sender);
        const bal = user ? user.wallet : 0;
        
        const success = Math.random() > 0.6;
        if (success) {
            const stolen = Math.floor(targetBal * 0.2);
            db.prepare('UPDATE users SET wallet = wallet - ? WHERE jid = ?').run(stolen, target);
            db.prepare('UPDATE users SET wallet = wallet + ? WHERE jid = ?').run(stolen, sender);
            r(`🥷 *HEIST SUCCESSFUL!*\n\nBreached vault of @${target.split('@')[0]}! Extracted *${stolen} credits*!`, { mentions: [target] });
        } else {
            const fine = Math.min(bal, 200);
            db.prepare('UPDATE users SET wallet = wallet - ? WHERE jid = ?').run(fine, sender);
            r(`🚨 *HEIST FAILED!*\n\nSecurity caught you. Paid *${fine} credits* bail.`);
        }
    }},
    { name: 'transfer', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        if (!g) return r('This command can only be used in groups.');
        const sender = m.key.participant || m.key.remoteJid;
        const target = m.message?.extendedTextMessage?.contextInfo?.participant;
        const amount = parseInt(a[0]);
        
        if (!target) return r('Reply to the operative you want to transfer to. Example: .transfer 100');
        if (!amount || amount < 10) return r('❌ Minimum transfer is 10 credits.');
        if (target === sender) return r('❌ Cannot transfer to yourself.');

        const user = db.prepare('SELECT wallet FROM users WHERE jid = ?').get(sender);
        const bal = user ? user.wallet : 0;
        if (bal < amount) return r(`❌ Insufficient funds. You only have ${bal}.`);

        db.prepare('UPDATE users SET wallet = wallet - ? WHERE jid = ?').run(amount, sender);
        let tUser = db.prepare('SELECT wallet FROM users WHERE jid = ?').get(target);
        if (!tUser) { db.prepare('INSERT INTO users (jid, wallet) VALUES (?, ?)').run(target, amount); }
        else { db.prepare('UPDATE users SET wallet = wallet + ? WHERE jid = ?').run(amount, target); }
        
        r(`💸 *TRANSFER COMPLETE*\n\nSent *${amount} credits* to @${target.split('@')[0]}!`, { mentions: [target] });
    }},
    { name: 'top', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        const top = db.prepare('SELECT jid, wallet FROM users ORDER BY wallet DESC LIMIT 10').all();
        let txt = `🏆 *ELITE LEADERBOARD*\n\n`;
        top.forEach((u, i) => {
            txt += `${i + 1}. @${u.jid.split('@')[0]} ➔ ${u.wallet} credits\n`;
        });
        r(txt, { mentions: top.map(u => u.jid) });
    }},
    { name: 'bet', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        const sender = m.key.participant || m.key.remoteJid;
        const bet = parseInt(a[0]);
        if (!bet || bet < 50) return r('❌ Minimum bet is 50 credits.\nUsage: .bet 100');
        const user = db.prepare('SELECT wallet FROM users WHERE jid = ?').get(sender);
        const bal = user ? user.wallet : 0;
        if (bal < bet) return r(`❌ Insufficient funds. You only have ${bal}.`);
        const win = Math.random() > 0.5;
        if (win) { db.prepare('UPDATE users SET wallet = wallet + ? WHERE jid = ?').run(bet, sender); r(`🎰 *WIN!*\n\nWagered *${bet}* and won *${bet * 2}* credits!`); }
        else { db.prepare('UPDATE users SET wallet = wallet - ? WHERE jid = ?').run(bet, sender); r(`🎰 *LOSS!*\n\nWagered *${bet}* and lost it all.`); }
    }}
];
