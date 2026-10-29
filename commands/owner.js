const fs = require('fs');
const { exec } = require('child_process');

const toggle = (key, label) => ({
    name: key,
    execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const val = (a[0] || '').toLowerCase();
        if (val === 'on') { st[key] = true; sv(); return r(`✅ *${label}* engaged.`); }
        if (val === 'off') { st[key] = false; sv(); return r(`❌ *${label}* disengaged.`); }
        return r(`📌 *${label}* is currently *${st[key] ? 'ON' : 'OFF'}*\nUsage: ${c.prefix}${key} on|off`);
    }
});

module.exports = [
    { name: 'system', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        const v = (a[0] || '').toUpperCase();
        if (!['PUBLIC', 'PRIVATE'].includes(v)) return r(`Usage: .system public|private\nCurrent: *${st.mode}*`);
        st.mode = v; 
        sv(); 
        r(`✅ System mode set to *${v}* globally.`);
    }},
    { name: 'setprefix', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        if (!a[0]) return r(`Usage: .setprefix <symbol>`);
        const sender = m.key.participant || m.key.remoteJid;
        db.prepare('UPDATE user_settings SET prefix = ? WHERE jid = ?').run(a[0], sender);
        r(`✅ Quick key set to *${a[0]}*`);
    }},
    { name: 'prefixfree', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        const sender = m.key.participant || m.key.remoteJid;
        db.prepare('UPDATE user_settings SET prefix = ? WHERE jid = ?').run('', sender);
        r('✅ Quick key removed.');
    }},
    { name: 'setbotname', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        if (!a.length) return r('Usage: .setbotname <name>');
        const sender = m.key.participant || m.key.remoteJid;
        db.prepare('UPDATE user_settings SET botname = ? WHERE jid = ?').run(a.join(' '), sender);
        r(`✅ Core identity set to *${a.join(' ')}*`);
    }},
    { name: 'reboot', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        await r('♻️ Rebooting Core...'); setTimeout(() => process.exit(1), 1500);
    }},
    { name: 'sync', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        await r('⏳ Syncing with GitHub...');
        const cmd = `if [ ! -d ".git" ]; then git init; git remote add origin https://github.com/userbellami/DEATH-CORE-X-BOT.git; fi; git fetch origin main; git reset --hard origin/main`;
        exec(cmd, (err) => {
            if (err) return r(`❌ Sync failed: ${err.message}`);
            r('⬇️ Code updated. Installing dependencies...');
            exec('npm install --unsafe-perm', (e2) => {
                if (e2) return r('❌ Dependency install failed');
                r('✅ Sync complete. Rebooting...'); setTimeout(() => process.exit(1), 2000);
            });
        });
    }},
    toggle('alwaysonline', 'Always Online'),
    toggle('autoread', 'Auto Read'),
    toggle('autotyping', 'Auto Typing'),
    toggle('autorecording', 'Auto Recording'),
    toggle('autoviewstatus', 'Auto View Status'),
    toggle('autolikestatus', 'Auto Like Status'),
    toggle('autostatusreact', 'Auto Status React'),
    toggle('antidelete', 'Anti Delete'),
    toggle('antideletestatus', 'Anti Delete Status'),
    toggle('antiedit', 'Anti Edit'),
    toggle('anticall', 'Anti Call'),
    toggle('antibug', 'Anti Bug'),
    toggle('autoreact', 'Auto React'),
    toggle('readreceipts', 'Read Receipts'),
    { name: 'setpp', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const img = m.message?.imageMessage || q?.imageMessage;
        if (!img) return r('Reply to an image with .setpp');
        const { downloadMediaMessage } = require('@whiskeysockets/baileys');
        try {
            const buf = await downloadMediaMessage({ message: { imageMessage: img }, key: m.key }, 'buffer', {});
            await s.updateProfilePicture(s.user.id, buf); r('✅ Profile picture updated.');
        } catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'setfullpp', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const img = m.message?.imageMessage || q?.imageMessage;
        if (!img) return r('Reply to an image with .setfullpp');
        const { downloadMediaMessage } = require('@whiskeysockets/baileys');
        try {
            const buf = await downloadMediaMessage({ message: { imageMessage: img }, key: m.key }, 'buffer', {});
            await s.updateProfilePicture(s.user.id, buf, true); r('✅ Full profile picture updated.');
        } catch (e) { r('❌ ' + e.message); }
    }}
];
