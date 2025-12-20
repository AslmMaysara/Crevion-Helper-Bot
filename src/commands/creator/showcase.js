// import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
// import { PermissionLevels } from '../../utils/permissions.js';
// import { config } from '../../config/config.js';

// export default {
//     data: new SlashCommandBuilder()
//         .setName('showcase')
//         .setDescription('🌟 Share your work with the community (Coming Soon)')
//         .addSubcommand(sub =>
//             sub.setName('code')
//                 .setDescription('Share code (Coming Soon)')
//         )
//         .addSubcommand(sub =>
//             sub.setName('project')
//                 .setDescription('Share project (Coming Soon)')
//         ),

//     permission: PermissionLevels.HELPER,

//     async execute(interaction, client) {
//         const funMessages = [
//             "🚧 **We're cooking something legendary!**\n\nThe showcase system is getting a **massive upgrade** to integrate with our upcoming website! Soon you'll be able to share your projects seamlessly across Discord and the web. Stay tuned! 🎨✨",
            
//             "🎨 **Hold tight, creator!**\n\nWe're building something **epic** for you! The new showcase system will blow your mind when it launches with our website. Your patience will be rewarded! 🚀💎",
            
//             "⚡ **Coming Soon™**\n\nThe showcase command is taking a power nap while we upgrade it to **legendary status**! When it wakes up, it'll be connected to our brand new website. Get ready for something amazing! 🔥",
            
//             "🌟 **Patience, young padawan...**\n\nThe showcase force is strong, but we're making it **even stronger**! Website integration + Discord = **ULTIMATE SHOWCASE POWER**! Worth the wait, trust us 😎",
            
//             "🛠️ **Under Construction (But Make It Cool)**\n\nWe're not just fixing bugs... we're adding **rocket boosters**! The new showcase will let you flex your projects on both Discord AND our website. Double the exposure, double the awesome! 🎯"
//         ];

//         const randomMessage = funMessages[Math.floor(Math.random() * funMessages.length)];

//         const embed = new EmbedBuilder()
//             .setColor(config.settings.defaultColor)
//             .setTitle('🚧 Showcase System - Upgrade in Progress')
//             .setDescription(randomMessage)
//             .addFields(
//                 { 
//                     name: '🌐 What\'s Coming?', 
//                     value: '• Website integration\n• Cross-platform sharing\n• Enhanced project profiles\n• Better discovery system', 
//                     inline: false 
//                 },
//                 { 
//                     name: '⏰ When?', 
//                     value: 'Soon™ (We\'re working hard on it!)', 
//                     inline: false 
//                 }
//             )
//             .setFooter({ 
//                 text: `${config.settings.embedFooter} | Stay tuned for updates!`,
//                 icon_url: config.settings.embedFooterIcon
//             })
//             .setTimestamp();

//         await interaction.reply({ embeds: [embed], ephemeral: true });
//     }
// };
// src/commands/creator/showcase.js - Temporarily Disabled

import { SlashCommandBuilder } from 'discord.js';
import { PermissionLevels } from '../../utils/permissions.js';
import { getConfig } from '../../models/index.js';

export default {
    data: new SlashCommandBuilder()
        .setName('showcase')
        .setDescription('🚧 Feature under development - Coming soon!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('code')
                .setDescription('Share a code snippet (Coming Soon)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('project')
                .setDescription('Share a project (Coming Soon)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('saved-codes')
                .setDescription('View your saved code snippets (Coming Soon)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('saved-projects')
                .setDescription('View your saved projects (Coming Soon)')
        ),

    permission: PermissionLevels.HELPER,

    async execute(interaction, client) {
        const dbConfig = await getConfig();
        
        // Fun messages that rotate
        const funMessages = [
            {
                title: '🚧 لسا شغالين على الميزة دي!',
                description: 'يا باشا صبرك علينا شوية 😅\n\nالميزة دي هتبقى **فخمة جداً** لما نخلصها!\nهنربطها بالموقع عشان كل مشروع تشاركه هنا يظهر برضو على الموقع الرسمي 🔥',
                fields: [
                    {
                        name: '🎯 اللي جاي',
                        value: '• رفع المشاريع من البوت للموقع\n• عرض المشاريع بشكل احترافي\n• نظام تقييم ومشاركة\n• بورتفوليو شخصي لكل مبدع',
                        inline: false
                    },
                    {
                        name: '⏰ متى؟',
                        value: 'هنخلص بإذن الله قريب جداً!\nتابع السيرفر عشان تعرف آخر التحديثات 🚀',
                        inline: false
                    }
                ]
            },
            {
                title: '🎨 الإبداع جاي قريب!',
                description: 'معلش يا فنان، الميزة دي لسا تحت التطوير 🛠️\n\nبس ثق إنها هتكون **حاجة تانية** لما تخلص!',
                fields: [
                    {
                        name: '💎 ليه الانتظار يستاهل؟',
                        value: '• ربط مباشر مع الموقع الرسمي\n• عرض احترافي لأعمالك\n• مشاركة سهلة ومباشرة\n• تفاعل من المجتمع',
                        inline: false
                    }
                ]
            },
            {
                title: '🚀 صبرك علينا شوية!',
                description: 'الميزة دي فعلاً هتكون قنبلة 💣\n\nبس محتاجة شوية وقت عشان نخليها **perfect** 👌',
                fields: [
                    {
                        name: '✨ اللي هتقدر تعمله',
                        value: '• مشاركة الأكواد والمشاريع\n• حفظ المشاريع المفضلة\n• التفاعل مع إبداعات الآخرين\n• بناء بورتفوليو قوي',
                        inline: false
                    }
                ]
            }
        ];

        // Select random message
        const message = funMessages[Math.floor(Math.random() * funMessages.length)];
        
        const warningColor = parseInt(dbConfig?.embedSettings?.warningColor?.replace('#', '') || 'FEE75C', 16);

        await interaction.reply({
            embeds: [{
                color: warningColor,
                title: message.title,
                description: message.description,
                fields: message.fields,
                thumbnail: { url: dbConfig?.embedSettings?.thumbnail },
                footer: {
                    text: `${dbConfig?.embedSettings?.footer} | نشكرك على صبرك ❤️`,
                    icon_url: dbConfig?.embedSettings?.footerIcon
                },
                timestamp: new Date()
            }],
            ephemeral: true
        });
    }
};