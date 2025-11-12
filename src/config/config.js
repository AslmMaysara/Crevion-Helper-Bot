import dotenv from 'dotenv';
dotenv.config();

export const config = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    
    about: {
        name: 'Crevion',
        tagline: 'بوت يدمج بين الإبداع والحقيقة',
        description: 'أنا Crevion، بوت Discord مصمم خصيصًا لخدمة مجتمع Crevion. أقدم مجموعة متنوعة من الأوامر والميزات التي تساعد في إدارة السيرفر والتفاعل مع الأعضاء بطريقة إبداعية وممتعة.',
        features: [
            '🎨 أوامر إبداعية ومبتكرة',
            '⚡ استجابة سريعة وموثوقة',
            '🛡️ نظام إدارة قوي',
            '🎉 تفاعل ممتع مع المجتمع',
            '📊 إحصائيات وتقارير مفصلة'
        ],
        version: '2.0.0',
        developer: 'Crevion Development Team',
        supportServer: 'https://discord.gg/mP9apCqDSZ',
        website: 'https://crevion.netlify.app',
        privacy: 'نحن نحترم خصوصيتك ولا نحفظ أي بيانات شخصية'
    },

    settings: {
        prefix: '-',
        defaultColor: 0x370080,
        errorColor: 0xED4245,
        successColor: 0x57F287,
        warningColor: 0xFEE75C,
        embedThumbnail: 'https://media.discordapp.net/attachments/1416900497423597739/1436341479072333888/Untitled166_20251103185926.png?ex=690f40be&is=690def3e&hm=34fce0a277a1a82c652520ea2a6f19b4e1b9532c71c650bbf0c067a26c163b86&=&format=webp&quality=lossless&width=990&height=990',
        embedFooter: 'Crevion Community',
        embedFooterIcon: 'https://media.discordapp.net/attachments/1416900497423597739/1436341479072333888/Untitled166_20251103185926.png?ex=690f40be&is=690def3e&hm=34fce0a277a1a82c652520ea2a6f19b4e1b9532c71c650bbf0c067a26c163b86&=&format=webp&quality=lossless&width=990&height=990'
    },

    permissions: {
        owners: [
            '1189242141755584674',
            '1005475237015605370'
        ],
        
        roles: {
            admin: ['1416773625329659916'],
            moderator: ['1416773625329659917'],
            helper: ['1416773625329659918'],
            vip: ['1416773625329659919'],
            member: ['@everyone']
        }
    },

    guild: {
        mainServerId: '1416461527485120566',
        logChannelId: '1416773881284399144'
    },

    features: {
        commandLogging: true,
        errorReporting: true,
        statusRotation: true,
        welcomeMessages: true,
        moderationLogs: true
    },

    apis: {
        // API keys here
    }
};

// Validation
if (!config.token) {
    console.error('❌ DISCORD_TOKEN is not set in .env file!');
    process.exit(1);
}

if (!config.clientId) {
    console.error('❌ CLIENT_ID is not set in .env file!');
    process.exit(1);
}