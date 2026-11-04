const axios = require('axios');

const getAnime = async (type, r, s, m, f, caption) => {
    try {
        const { data } = await axios.get(`https://api.waifu.pics/sfw/${type}`);
        await s.sendMessage(f, { image: { url: data.url }, caption }, { quoted: m });
    } catch (e) { r('❌ Failed to fetch image.'); }
};

module.exports = [
    { name: 'waifu', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => getAnime('waifu', r, s, m, f, '🌸 *WAIFU*') },
    { name: 'neko', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => getAnime('neko', r, s, m, f, '🐱 *NEKO*') },
    { name: 'embrace', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => getAnime('hug', r, s, m, f, '🫂 *EMBRACE*') },
    { name: 'aniquote', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        try {
            const { data } = await axios.get('https://animechan.vercel.app/api/random');
            r(`⛩️ *ANIME QUOTE*\n\n"${data.quote}"\n\n— *${data.character}* (${data.anime})`);
        } catch (e) { r('❌ Failed to fetch quote.'); }
    }}
];
