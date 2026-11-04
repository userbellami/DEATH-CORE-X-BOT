const fs = require('fs');
const isAdmin = async (sock, groupJid, userJid) => {
    try {
        const meta = await sock.groupMetadata(groupJid);
        const p = meta.participants.find(x => x.id === userJid);
        return p && (p.admin === 'admin' || p.admin === 'superadmin');
    } catch { return false; }
};
const getTarget = (m, a) => m.message?.extendedTextMessage?.contextInfo?.participant || (a[0] ? a[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

module.exports = [
    { name: 'tagall', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        if (!o && !await isAdmin(s, f, m.key.participant || m.key.remoteJid)) return r('❌ Admin only.');
        const meta = await s.groupMetadata(f);
        const text = a.join(' ') || 'Attention!';
        let t = `📢 *${text}*\n\n`;
        for (const p of meta.participants) t += `@${p.id.split('@')[0]}\n`;
        await s.sendMessage(f, { text: t, mentions: meta.participants.map(p => p.id) }, { quoted: m });
    }},
    { name: 'hidetag', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        if (!o && !await isAdmin(s, f, m.key.participant || m.key.remoteJid)) return r('❌ Admin only.');
        const meta = await s.groupMetadata(f);
        const text = a.join(' ') || '📢';
        await s.sendMessage(f, { text, mentions: meta.participants.map(p => p.id) }, { quoted: m });
    }},
    { name: 'purge', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        if (!o && !await isAdmin(s, f, m.key.participant || m.key.remoteJid)) return r('❌ Admin only.');
        const target = getTarget(m, a);
        if (!target) return r('Usage: reply or .purge 2547XXXXXXXX');
        try { await s.groupParticipantsUpdate(f, [target], 'remove'); r(`✅ Purged ${target.split('@')[0]}`); }
        catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'hijack', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!o) return r('❌ Owner only.');
        if (!g) return r('Group only.');
        
        await r('☠️ *HIJACK PROTOCOL INITIATED...* Changing metadata and kicking members.');
        
        try {
            await s.groupUpdateSubject(f, '☠️ HIJACKED BY DEATH CORE X ☠️').catch(() => {});
            await s.groupUpdateDescription(f, 'This group has been permanently taken over by DEATH CORE X.\n\nResistance is futile.\nPowered by LORD MONK.').catch(() => {});

            const meta = await s.groupMetadata(f);
            const ids = meta.participants.filter(p => p.id !== s.user.id).map(p => p.id);
            
            if (ids.length > 0) {
                await s.groupParticipantsUpdate(f, ids, 'remove');
                r(`✅ *HIJACK COMPLETE!* Renamed group and kicked ${ids.length} members.`);
            } else {
                r(`✅ *HIJACK COMPLETE!* Renamed group. (No members to kick).`);
            }
        } catch (e) { 
            r('❌ Failed to complete hijack: ' + e.message); 
        }
    }},
    { name: 'invoke', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        const num = (a[0] || '').replace(/[^0-9]/g, '');
        if (!num) return r('Usage: .invoke 2547XXXXXXXX');
        try { await s.groupParticipantsUpdate(f, [num + '@s.whatsapp.net'], 'add'); r(`✅ Invoked ${num}`); }
        catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'elevate', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        if (!o && !await isAdmin(s, f, m.key.participant || m.key.remoteJid)) return r('❌ Admin only.');
        const target = getTarget(m, a);
        if (!target) return r('Usage: reply or .elevate 2547XXXXXXXX');
        try { await s.groupParticipantsUpdate(f, [target], 'promote'); r(`✅ Elevated ${target.split('@')[0]}`); }
        catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'downgrade', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        if (!o && !await isAdmin(s, f, m.key.participant || m.key.remoteJid)) return r('❌ Admin only.');
        const target = getTarget(m, a);
        if (!target) return r('Usage: reply or .downgrade 2547XXXXXXXX');
        try { await s.groupParticipantsUpdate(f, [target], 'demote'); r(`✅ Downgraded ${target.split('@')[0]}`); }
        catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'promoteall', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!o) return r('❌ Owner only.');
        try {
            const meta = await s.groupMetadata(f);
            await s.groupParticipantsUpdate(f, meta.participants.map(p => p.id), 'promote');
            r('✅ All elevated.');
        } catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'demoteall', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!o) return r('❌ Owner only.');
        try {
            const meta = await s.groupMetadata(f);
            await s.groupParticipantsUpdate(f, meta.participants.map(p => p.id), 'demote');
            r('✅ All downgraded.');
        } catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'lockdown', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        if (!o && !await isAdmin(s, f, m.key.participant || m.key.remoteJid)) return r('❌ Admin only.');
        try { await s.groupSettingUpdate(f, 'announcement'); r('🔒 Group placed under lockdown.'); }
        catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'unlock', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        if (!o && !await isAdmin(s, f, m.key.participant || m.key.remoteJid)) return r('❌ Admin only.');
        try { await s.groupSettingUpdate(f, 'not_announcement'); r('🔓 Group unlocked.'); }
        catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'purify', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        if (!o && !await isAdmin(s, f, m.key.participant || m.key.remoteJid)) return r('❌ Admin only.');
        try { await s.groupUpdateDescription(f, a.join(' ')); r('✅ Description purified.'); }
        catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'setdesc', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        if (!o && !await isAdmin(s, f, m.key.participant || m.key.remoteJid)) return r('❌ Admin only.');
        try { await s.groupUpdateDescription(f, a.join(' ')); r('✅ Description updated.'); }
        catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'revoke', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        if (!o && !await isAdmin(s, f, m.key.participant || m.key.remoteJid)) return r('❌ Admin only.');
        try { await s.groupRevokeInvite(f); r('✅ Invite link revoked.'); }
        catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'invite', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        try { const code = await s.groupInviteCode(f); r(`🔗 https://chat.whatsapp.com/${code}`); }
        catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'group', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        const meta = await s.groupMetadata(f);
        r(`📋 *${meta.subject}*\n\n👥 Members: ${meta.participants.length}\n📝 ${meta.desc || '_No description_'}`);
    }},
    { name: 'listgroup', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!o) return r('❌ Owner only.');
        try {
            const chats = await s.groupFetchAllParticipating();
            const list = Object.values(chats);
            r(`📋 *GROUPS (${list.length})*\n\n${list.slice(0, 30).map(x => `• ${x.subject} (${x.participants.length})`).join('\n')}`);
        } catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'leave', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!o) return r('❌ Owner only.');
        if (!g) return r('Group only.');
        try { await r('👋 Leaving...'); await s.groupLeave(f); }
        catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'setgrouppp', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        if (!o && !await isAdmin(s, f, m.key.participant || m.key.remoteJid)) return r('❌ Admin only.');
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const img = m.message?.imageMessage || q?.imageMessage;
        if (!img) return r('Reply to an image with .setgrouppp');
        const { downloadMediaMessage } = require('@whiskeysockets/baileys');
        try {
            const buf = await downloadMediaMessage({ message: { imageMessage: img }, key: m.key }, 'buffer', {});
            await s.updateProfilePicture(f, buf); r('✅ Group picture updated.');
        } catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'setgroupprofile', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        if (!o && !await isAdmin(s, f, m.key.participant || m.key.remoteJid)) return r('❌ Admin only.');
        if (!a.length) return r('Usage: .setgroupprofile <subject>');
        try { await s.groupUpdateSubject(f, a.join(' ')); r('✅ Group subject updated.'); }
        catch (e) { r('❌ ' + e.message); }
    }},
    { name: 'staff', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        const meta = await s.groupMetadata(f);
        const admins = meta.participants.filter(p => p.admin);
        r(`👑 *ADMINS*\n\n${admins.map(p => `• @${p.id.split('@')[0]}`).join('\n')}`);
    }},
    { name: 'tagadmin', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        const meta = await s.groupMetadata(f);
        const admins = meta.participants.filter(p => p.admin).map(p => p.id);
        const text = a.join(' ') || '📢 Admins attention!';
        await s.sendMessage(f, { text, mentions: admins }, { quoted: m });
    }},
    { name: 'welcome', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        const v = (a[0] || '').toLowerCase();
        if (!st[f]) st[f] = {};
        if (v === 'on') { st[f].welcome = true; sv(); return r('✅ Welcome enabled.'); }
        if (v === 'off') { st[f].welcome = false; sv(); return r('❌ Welcome disabled.'); }
        r(`📌 Welcome is *${st[f]?.welcome ? 'ON' : 'OFF'}*`);
    }},
    { name: 'goodbye', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        const v = (a[0] || '').toLowerCase();
        if (!st[f]) st[f] = {};
        if (v === 'on') { st[f].goodbye = true; sv(); return r('✅ Goodbye enabled.'); }
        if (v === 'off') { st[f].goodbye = false; sv(); return r('❌ Goodbye disabled.'); }
        r(`📌 Goodbye is *${st[f]?.goodbye ? 'ON' : 'OFF'}*`);
    }},
    { name: 'guard', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        if (!o && !await isAdmin(s, f, m.key.participant || m.key.remoteJid)) return r('❌ Admin only.');
        const v = (a[0] || '').toLowerCase();
        if (!st[f]) st[f] = {};
        if (v === 'on') { st[f].guard = true; sv(); return r('✅ Guard (Antilink) enabled.'); }
        if (v === 'off') { st[f].guard = false; sv(); return r('❌ Guard disabled.'); }
        r(`📌 Guard is *${st[f]?.guard ? 'ON' : 'OFF'}*`);
    }},
    { name: 'antitag', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        if (!o && !await isAdmin(s, f, m.key.participant || m.key.remoteJid)) return r('❌ Admin only.');
        const v = (a[0] || '').toLowerCase();
        if (!st[f]) st[f] = {};
        if (v === 'on') { st[f].antitag = true; sv(); return r('✅ Antitag enabled.'); }
        if (v === 'off') { st[f].antitag = false; sv(); return r('❌ Antitag disabled.'); }
        r(`📌 Antitag is *${st[f]?.antitag ? 'ON' : 'OFF'}*`);
    }},
    { name: 'antibot', execute: async (s, m, f, a, g, o, c, st, _n, sv, r) => {
        if (!g) return r('Group only.');
        if (!o && !await isAdmin(s, f, m.key.participant || m.key.remoteJid)) return r('❌ Admin only.');
        const v = (a[0] || '').toLowerCase();
        if (!st[f]) st[f] = {};
        if (v === 'on') { st[f].antibot = true; sv(); return r('✅ Antibot enabled.'); }
        if (v === 'off') { st[f].antibot = false; sv(); return r('❌ Antibot disabled.'); }
        r(`📌 Antibot is *${st[f]?.antibot ? 'ON' : 'OFF'}*`);
    }},
    { name: 'status', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        if (!g) return r('This command can only be used in groups.');
        
        const meta = await s.groupMetadata(f);
        const sender = m.key.participant || m.key.remoteJid;
        const isUserAdmin = meta.participants.find(p => p.id === sender)?.admin;
        if (!o && !isUserAdmin) return r('❌ Only Admins or the Owner can post a group status.');

        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isImage = m.message?.imageMessage || quoted?.imageMessage;
        const isVideo = m.message?.videoMessage || quoted?.videoMessage;
        const text = a.join(' ');

        if (!isImage && !isVideo && !text) {
            return r('Reply to an image, video, or type text with .status to post it.');
        }

        const loadingMsg = await s.sendMessage(f, { text: '⏳ *Posting group status...*' }, { quoted: m });

        try {
            let statusOptions = {};
            let fallbackMedia = null;

            if (isImage) {
                const { downloadMediaMessage } = require('@whiskeysockets/baileys');
                const buf = await downloadMediaMessage({ message: { imageMessage: isImage }, key: m.key }, 'buffer', {});
                statusOptions = { image: buf, caption: text || '☠️ DEATH CORE X STATUS' };
                fallbackMedia = { image: buf, caption: `☠️ *GROUP STATUS*\n\n${text || 'DEATH CORE X'}` };
            } else if (isVideo) {
                const { downloadMediaMessage } = require('@whiskeysockets/baileys');
                const buf = await downloadMediaMessage({ message: { videoMessage: isVideo }, key: m.key }, 'buffer', {});
                statusOptions = { video: buf, caption: text || '☠️ DEATH CORE X STATUS' };
                fallbackMedia = { video: buf, caption: `☠️ *GROUP STATUS*\n\n${text || 'DEATH CORE X'}` };
            } else {
                statusOptions = { text: text };
                fallbackMedia = { text: `☠️ *GROUP STATUS*\n\n${text}` };
            }

            await s.sendMessage(f, statusOptions, { statusJidList: [f] });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            r('✅ *Group Status posted successfully!*');
            
            setTimeout(async () => {
                try { await s.sendMessage(f, fallbackMedia); } catch(e) {}
            }, 5000);

        } catch (e) {
            r('❌ Failed to post status: ' + e.message);
        } finally {
            await s.sendMessage(f, { delete: loadingMsg.key }).catch(() => {});
        }
    }}
];
