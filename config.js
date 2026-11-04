require('dotenv').config();
module.exports = {
    botName: process.env.BOT_NAME,
    dev: process.env.OWNER_NAME,
    version: process.env.VERSION,
    prefix: process.env.PREFIX,
    sessionName: 'auth_info_baileys',
    telegramToken: process.env.TELEGRAM_TOKEN,
    channelLink: process.env.CHANNEL_LINK,
    tgBotUrl: process.env.TG_BOT_URL,
    tgChannelUrl: process.env.TG_CHANNEL_URL,
    tgGroupUrl: process.env.TG_GROUP_URL,
    tgChannelUsername: process.env.TG_CHANNEL_USERNAME,
    tgGroupUsername: process.env.TG_GROUP_USERNAME,
    devNumber: '254797618847',
    owners: ['254797618847'],
    sudo: [],
    apis: { ai: '', yt: '', img: '', news: '' }
};
