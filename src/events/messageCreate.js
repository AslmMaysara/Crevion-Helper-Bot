// src/events/messageCreate.js - Enhanced with Fun Bot Mentions

import { Events, AttachmentBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { getConfig, incrementCommandCount, incrementErrorCount } from '../models/index.js';
import { hasPermission, getPermissionErrorMessage, getCommandRequiredLevel } from '../utils/permissions.js';
import { autoReply } from '../utils/autoreply.js';
import { autoLine } from '../utils/autoline.js';
import { lineManager } from '../utils/lineManager.js';

// 🎭 Fun bot mention responses (random selection)
const FUN_MENTIONS = [
    "أهلاً بك يا صديقي 👋 معاك الـ Aura Farmer بنفسو **Crévion** 🔥",
    "يسطا انت منور السيرفر كله 💫 محتاج حاجة؟",
    "مرحبا بالأسطورة 🎯 أنا Crévion في خدمتك!",
    "يا هلا والله 🌟 تحت أمرك يا فنان!",
    "وعليكم السلام 😎 Crévion حاضر دايماً!",
    "نورت يا كبير 👑 قول وأنا أنفذ!",
    "تشرفنا 🎨 أنا هنا عشان أساعدك!",
    "يا مساء الفل 🌸 محتاج مساعدة في حاجة؟",
    "مين دا اللي نور المكان؟ ✨ أهلاً بيك!",
    "يسطا انت جامد فشخ 🔥 عايز إيه النهاردة؟",
    "هاي هاي 👋 Crévion Bot في الخدمة!",
    "بص بص مين جالنا 🎭 الإبداع وصل!",
    "تعالى يا عم المبدع 🚀 أنا جاهز!",
    "كده كده المكان بقى فخم 💎 تحت أمرك!",
    "يا نهار أسود منور 🌟 تشرفنا بيك!"
];

export default {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;

        try {
            await processMessage(message, client);
        } catch (error) {
            console.error('❌ Error in messageCreate:', error);
        }
    }
};

async function processMessage(message, client) {
    
    // 💬 Bot mention response with FUN random replies
    const botMentioned = message.mentions.has(client.user);
    const hasEveryone = message.mentions.everyone;

    if (botMentioned && !hasEveryone) {
        // Select random fun response
        const randomResponse = FUN_MENTIONS[Math.floor(Math.random() * FUN_MENTIONS.length)];
        
        // Reply WITHOUT mention (clean reply)
        return await message.reply({ 
            content: randomResponse,
            allowedMentions: { repliedUser: false }
        });
    }

    // 🎨 Auto Line System - INSTANT (NO COOLDOWN)
    const dbConfig = client.dbConfig || await getConfig();
    const lineUrl = dbConfig?.lineConfig?.url || lineManager.getUrl();
    
    if (autoLine.isEnabled(message.channel.id) && lineUrl) {
        try {
            // Send line immediately after every message
            const response = await fetch(lineUrl);
            if (response.ok) {
                const buffer = await response.arrayBuffer();
                const attachment = new AttachmentBuilder(Buffer.from(buffer), { name: 'line.png' });
                await message.channel.send({ files: [attachment] });
                autoLine.incrementCount(message.channel.id);
            }
        } catch (err) {
            console.error('❌ Auto line error:', err.message);
        }
    }

    // 🤖 Auto Reply System
    const replyData = autoReply.check(message);
    if (replyData) {
        try {
            let responseContent = replyData.response;
            
            if (replyData.mention) {
                responseContent = `${message.author} ${responseContent}`;
            }

            if (replyData.reply) {
                await message.reply({
                    content: responseContent,
                    allowedMentions: { repliedUser: false }
                });
            } else {
                await message.channel.send(responseContent);
            }
        } catch (err) {
            console.error('❌ Error sending auto reply:', err.message);
        }
    }

    // 📝 Manual line trigger commands ("خط" or "line") - Role-based permission
    const content = message.content.trim().toLowerCase();
    if (content === "خط" || content === "line") {
        const member = await message.guild.members.fetch(message.author.id);
        
        // Check if member has allowed role from database
        if (dbConfig?.lineConfig?.allowedRoles) {
            const hasRole = member.roles.cache.some(role => 
                dbConfig.lineConfig.allowedRoles.includes(role.id)
            );
            if (!hasRole) return; // Silently ignore
        } else if (!lineManager.hasPermission(member)) {
            return; // Fallback to old system
        }

        const lineUrl = dbConfig?.lineConfig?.url || lineManager.getUrl();
        if (!lineUrl) {
            return await message.reply({
                content: "⚠️ No line image configured. Ask an admin to set one using `/line set`",
                allowedMentions: { repliedUser: false }
            });
        }

        try {
            const response = await fetch(lineUrl);
            if (!response.ok) throw new Error('Failed to fetch image');
            
            const buffer = await response.arrayBuffer();
            const attachment = new AttachmentBuilder(Buffer.from(buffer), { name: 'line.png' });

            await message.delete().catch(() => {}); // Delete user message
            await message.channel.send({ files: [attachment] });

        } catch (err) {
            console.error('❌ Error sending line image:', err.message);
            await message.reply({
                content: '❌ Error loading image. Please check the URL!',
                allowedMentions: { repliedUser: false }
            });
        }
        return;
    }

    // 🔧 Prefix Commands Handler
    const prefix = dbConfig?.prefix || '-';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = client.prefixCommands.get(commandName);
    if (!command) return;

    try {
        // 🔐 Permission check using database
        if (command.permission !== undefined) {
            const member = await message.guild.members.fetch(message.author.id);
            
            if (!hasPermission(member, commandName, command.permission)) {
                const requiredLevel = getCommandRequiredLevel(commandName, command.permission);
                const errorMsg = getPermissionErrorMessage(requiredLevel);
                return await message.reply({
                    ...errorMsg,
                    allowedMentions: { repliedUser: false }
                });
            }
        }

        // Execute command
        await command.executePrefix(message, args, client);
        
        // Increment counter in database
        await incrementCommandCount();

        // Log command
        console.log(`📝 ${message.author.tag} used ${prefix}${commandName}`);

    } catch (err) {
        console.error(`❌ Error in prefix command ${commandName}:`, err);
        
        // Increment error counter in database
        await incrementErrorCount();

        const errorEmbed = {
            color: 0xED4245,
            title: '❌ Error',
            description: 'An error occurred while executing the command. Please try again.',
            footer: { text: 'Crévion Community' }
        };

        await message.reply({ 
            embeds: [errorEmbed],
            allowedMentions: { repliedUser: false }
        }).catch(console.error);
    }
}