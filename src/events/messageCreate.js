// src/events/messageCreate.js - FIXED COMPLETELY

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
    const content = message.content.trim().toLowerCase();

    // ═══════════════════════════════════════════════════════════════
    // ⚡ PRIORITY 1: Manual line command "خط" or "line"
    // ═══════════════════════════════════════════════════════════════
    if (content === "خط" || content === "line") {
        const member = await message.guild.members.fetch(message.author.id);
        const hasAccess = await hasLineAccessPermission(member, dbConfig);

        if (!hasAccess) {
            console.log(`📏 ❌ User ${message.author.tag} has no line permission`);
            return;
        }

        if (!lineUrl || lineUrl === 'null' || lineUrl === '') {
            return await message.reply({
                embeds: [{
                    color: 0xFEE75C,
                    title: '⚠️ لا يوجد خط',
                    description: 'لم يتم تعيين صورة الخط.\n\nاستخدم `/line set <url>`',
                    footer: { text: 'Crévion' }
                }],
                allowedMentions: { repliedUser: false }
            });
        }

        try {
            console.log(`📏 Fetching line: ${lineUrl}`);

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(lineUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/*'
                },
                redirect: 'follow'
            });

            clearTimeout(timeout);

            // ✅ CHECK STATUS CODE FIRST!
            if (!response.ok) {
                console.error(`📏 HTTP Error: ${response.status}`);
                throw new Error(`HTTP_${response.status}`);
            }

            // Check content type
            const contentType = response.headers.get('content-type');
            const isDiscordCDN = lineUrl.includes('cdn.discordapp.com') || 
                                 lineUrl.includes('media.discordapp.net');

            if (contentType && !contentType.startsWith('image/') && !isDiscordCDN) {
                console.error(`📏 Not an image: ${contentType}`);
                throw new Error('NOT_IMAGE');
            }

            const buffer = await response.arrayBuffer();

            if (buffer.byteLength === 0) {
                console.error(`📏 Empty buffer`);
                throw new Error('EMPTY_IMAGE');
            }
            
            if (buffer.byteLength > 8 * 1024 * 1024) {
                console.error(`📏 Image too large: ${(buffer.byteLength / 1024 / 1024).toFixed(2)}MB`);
                throw new Error('IMAGE_TOO_LARGE');
            }

            const attachment = new AttachmentBuilder(Buffer.from(buffer), { name: 'line.png' });

            await message.delete().catch(() => {});
            await message.channel.send({ files: [attachment] });

            console.log(`📏 ✅ Line sent successfully by ${message.author.tag}`);
            return;

        } catch (err) {
            console.error(`📏 ❌ Line error for ${message.author.tag}:`, err.message);

            const { isOwner } = await import('../utils/permissions.js');
            const isUserOwner = await isOwner(message.author.id);

            if (isUserOwner) {
                let errorMsg = 'فشل تحميل الخط';
                let details = '';

                if (err.name === 'AbortError') {
                    errorMsg = '⏱️ انتهت المهلة';
                    details = 'الصورة بطيئة جداً في التحميل (أكثر من 15 ثانية).';
                } else if (err.message.includes('HTTP_404')) {
                    errorMsg = '🔍 الصورة غير موجودة (404)';
                    details = 'الرابط لم يعد يعمل. الصورة قد تكون محذوفة.';
                } else if (err.message.includes('HTTP_403')) {
                    errorMsg = '🔒 ممنوع الوصول (403)';
                    details = 'السيرفر يرفض الوصول. حاول رفع الصورة على Discord.';
                } else if (err.message.includes('HTTP_')) {
                    const code = err.message.replace('HTTP_', '');
                    errorMsg = `⚠️ خطأ HTTP ${code}`;
                    details = 'السيرفر أرجع خطأ.';
                } else if (err.message === 'NOT_IMAGE') {
                    errorMsg = '🖼️ ليس صورة';
                    details = 'الرابط لا يشير إلى صورة صالحة.';
                } else if (err.message === 'EMPTY_IMAGE') {
                    errorMsg = '📭 الصورة فارغة';
                    details = 'الملف فارغ أو تالف.';
                } else if (err.message === 'IMAGE_TOO_LARGE') {
                    errorMsg = '📦 الصورة كبيرة جداً';
                    details = 'حجم الصورة أكثر من 8MB.';
                } else if (err.message.includes('ENOTFOUND')) {
                    errorMsg = '🌐 الرابط غير موجود';
                    details = 'العنوان غير صحيح أو لم يعد موجوداً.';
                }

                return await message.reply({
                    embeds: [{
                        color: 0xED4245,
                        title: `${errorMsg}`,
                        description: `${details}\n\n**💡 الحلول:**\n• ارفع الصورة على Discord وانسخ الرابط\n• استخدم \`/line set <url>\` لتحديث الرابط\n• تأكد من أن الرابط يعمل في المتصفح\n\n**🔗 الرابط الحالي:**\n\`${lineUrl}\``,
                        footer: { text: '🔧 رسالة للأونر فقط • Crévion' },
                        timestamp: new Date()
                    }],
                    allowedMentions: { repliedUser: false }
                });
            }

            // Silent fail for non-owners
            return;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎨 Auto Line System
    // ═══════════════════════════════════════════════════════════════
    if (autoLine.isEnabled(message.channel.id) && lineUrl && lineUrl !== 'null') {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(lineUrl, {
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            clearTimeout(timeout);

            if (response.ok) {
                const buffer = await response.arrayBuffer();
                if (buffer.byteLength > 0 && buffer.byteLength < 8 * 1024 * 1024) {
                    const attachment = new AttachmentBuilder(Buffer.from(buffer), { name: 'line.png' });
                    await message.channel.send({ files: [attachment] });
                    autoLine.incrementCount(message.channel.id);
                }
            }
        } catch (err) {
            // Silent fail for auto-line
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🤖 AUTO REPLY SYSTEM
    // ═══════════════════════════════════════════════════════════════
    try {
        const replyData = await autoReply.check(message);

        if (replyData) {
            console.log(`🤖 Auto reply triggered: "${replyData.trigger}" → "${replyData.response}"`);

            try {
                const responseContent = replyData.response;

                if (replyData.reply) {
                    await message.reply({
                        content: responseContent,
                        allowedMentions: {
                            repliedUser: replyData.mention
                        }
                    });
                } else {
                    await message.channel.send(responseContent);
                }

                console.log(`✅ Auto reply sent (ping: ${replyData.mention})`);

            } catch (err) {
                console.error('❌ Auto reply send error:', err.message);
            }
        }
    } catch (err) {
        console.error('❌ Auto reply check error:', err.message);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔧 Prefix Commands Handler
    // ═══════════════════════════════════════════════════════════════
    const prefix = dbConfig?.prefix || '-';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = client.prefixCommands.get(commandName);
    if (!command) return;

    try {
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
                description: 'Command failed.',
                footer: { text: 'Crévion' }
            }],
            allowedMentions: { repliedUser: false }
        }).catch(console.error);
    }
}

// ═══════════════════════════════════════════════════════════════
// ✅ CHECK LINE PERMISSION
// ═══════════════════════════════════════════════════════════════
async function hasLineAccessPermission(member, dbConfig) {
    const owners = dbConfig?.permissions?.owners || [];
    const userId = member.id || member.user?.id;

    if (owners.includes(userId)) {
        return true;
    }

    const lineAccessRoles = dbConfig?.permissions?.lineAccess || [];

    if (lineAccessRoles.length === 0) {
        return false;
    }

    return lineAccessRoles.some(roleId => member.roles.cache.has(roleId));
}