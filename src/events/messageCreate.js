// src/events/messageCreate.js - FIXED: INSTANT LINE RESPONSE

import { Events, AttachmentBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { getConfig, incrementCommandCount, incrementErrorCount } from '../models/index.js';
import { hasPermission, getPermissionErrorMessage, getCommandRequiredLevel } from '../utils/permissions.js';
import { autoReply } from '../utils/autoreply.js';
import { autoLine } from '../utils/autoline.js';

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
    
    // Get config ONCE
    const dbConfig = client.dbConfig || await getConfig();
    const lineUrl = dbConfig?.lineConfig?.url;
    
    // ⚡ PRIORITY 1: Manual line command "خط" or "line" - INSTANT RESPONSE
    const content = message.content.trim().toLowerCase();
    if (content === "خط" || content === "line") {
        // NO permission check - let everyone use it
        // Or check permissions if you want:
        // const member = await message.guild.members.fetch(message.author.id);
        // if (!hasLinePermission(member, dbConfig)) return;
        
        if (!lineUrl) {
            return await message.reply({
                content: "⚠️ No line configured. Ask admin to use `/line set`",
                allowedMentions: { repliedUser: false }
            });
        }

        try {
            // Fetch and send IMMEDIATELY
            const response = await fetch(lineUrl, { timeout: 5000 });
            if (!response.ok) throw new Error('Failed to fetch');
            
            const buffer = await response.arrayBuffer();
            const attachment = new AttachmentBuilder(Buffer.from(buffer), { name: 'line.png' });

            // Delete user message (optional)
            await message.delete().catch(() => {});
            
            // Send line INSTANTLY
            await message.channel.send({ files: [attachment] });
            
            console.log(`📏 Line sent by ${message.author.tag}`);
            return; // STOP here
            
        } catch (err) {
            console.error('❌ Line fetch error:', err.message);
            return await message.reply({
                content: '❌ Failed to load line image!',
                allowedMentions: { repliedUser: false }
            });
        }
    }

    // 🎨 Auto Line System (after every message in enabled channels)
    if (autoLine.isEnabled(message.channel.id) && lineUrl) {
        try {
            const response = await fetch(lineUrl, { timeout: 5000 });
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
            console.error('❌ Auto reply error:', err.message);
        }
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
        // Permission check
        if (command.permission !== undefined) {
            const member = await message.guild.members.fetch(message.author.id);
            
            if (!await hasPermission(member, commandName, command.permission)) {
                const requiredLevel = await getCommandRequiredLevel(commandName, command.permission);
                const errorMsg = getPermissionErrorMessage(requiredLevel);
                return await message.reply({
                    ...errorMsg,
                    allowedMentions: { repliedUser: false }
                });
            }
        }

        // Execute command
        await command.executePrefix(message, args, client);
        await incrementCommandCount();

        console.log(`📝 ${message.author.tag} used ${prefix}${commandName}`);

    } catch (err) {
        console.error(`❌ Error in ${commandName}:`, err);
        await incrementErrorCount();

        await message.reply({ 
            embeds: [{
                color: 0xED4245,
                title: '❌ Error',
                description: 'Command failed. Try again.',
                footer: { text: 'Crévion' }
            }],
            allowedMentions: { repliedUser: false }
        }).catch(console.error);
    }
}

// Helper: Check line permission (optional)
function hasLinePermission(member, dbConfig) {
    const allowedRoles = dbConfig?.lineConfig?.allowedRoles || [];
    
    // If no roles configured, allow everyone
    if (allowedRoles.length === 0) return true;
    
    // Check if user has any allowed role
    return allowedRoles.some(roleId => member.roles.cache.has(roleId));
}