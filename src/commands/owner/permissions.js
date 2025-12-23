// src/commands/owner/permissions.js - COMPLETE ULTIMATE VERSION 🎛️

import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { PermissionLevels, getPermissionLevelName } from '../../utils/permissions.js';
import { getConfig, updateConfig } from '../../models/index.js';

// ✅ DEFAULT PERMISSIONS
const DEFAULT_PERMISSIONS = {
    owners: [],
    roles: {
        admin: ['1418262364217671791', '1425149336718803155'],
        moderator: ['1416771195101249586'],
        helper: ['1417479428270985257'],
        vip: ['1422281656437313597', '1416461527485120567'],
        member: ['1416461527485120568']
    },
    users: {},
    commands: {},
    lineAccess: ['1418262364217671791', '1425149336718803155', '1416771195101249586']
};

export default {
    data: new SlashCommandBuilder()
        .setName('permissions')
        .setDescription('🎛️ Ultimate Permissions Dashboard (Owner Only)'),
    permission: PermissionLevels.OWNER,
    async execute(interaction, client) {
        await showMainDashboard(interaction, client);
    }
};

// ═══════════════════════════════════════════════════════════════
// 🎛️ MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════

async function showMainDashboard(interaction, client) {
    try {
        const dbConfig = await getConfig();
        
        const stats = {
            owners: dbConfig.permissions?.owners?.length || 0,
            admin: dbConfig.permissions?.roles?.admin?.length || 0,
            moderator: dbConfig.permissions?.roles?.moderator?.length || 0,
            helper: dbConfig.permissions?.roles?.helper?.length || 0,
            vip: dbConfig.permissions?.roles?.vip?.length || 0,
            member: dbConfig.permissions?.roles?.member?.length || 0,
            users: Object.keys(dbConfig.permissions?.users || {}).length,
            commands: Object.keys(dbConfig.permissions?.commands || {}).length,
            lineRoles: dbConfig.permissions?.lineAccess?.length || 0
        };

        const embed = new EmbedBuilder()
            .setColor(0x370080)
            .setAuthor({
                name: 'Crévion Ultimate Permissions System',
                iconURL: client.user.displayAvatarURL()
            })
            .setTitle('🎛️ Advanced Permission Management Dashboard')
            .setDescription(
                '**Welcome to the most powerful permission system!**\n\n' +
                '• Role-based permissions\n' +
                '• User-specific permissions\n' +
                '• Command-level permissions\n' +
                '• Line system access control'
            )
            .addFields(
                {
                    name: '📊 Current Setup',
                    value: [
                        `👑 **Owners:** ${stats.owners}`,
                        `⚙️ **Admins:** ${stats.admin} roles`,
                        `🛡️ **Moderators:** ${stats.moderator} roles`,
                        `💎 **Helpers:** ${stats.helper} roles`,
                        `⭐ **VIPs:** ${stats.vip} roles`,
                        `👥 **Members:** ${stats.member} roles`,
                        `\n📏 **Line Access:** ${stats.lineRoles} roles`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎯 Hierarchy (Top→Bottom)',
                    value: [
                        '**6️⃣ Owner** - Everything',
                        '**5️⃣ Admin** - Full management',
                        '**4️⃣ Moderator** - Moderation',
                        '**3️⃣ Helper** - Help & tools',
                        '**2️⃣ VIP** - VIP features',
                        '**1️⃣ Member** - Creative tools',
                        '**0️⃣ Everyone** - Basic'
                    ].join('\n'),
                    inline: true
                }
            )
            .setThumbnail(interaction.guild.iconURL())
            .setFooter({ text: 'Select an option below' })
            .setTimestamp();

        const mainMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('perm_main_menu')
                    .setPlaceholder('🎯 Select Configuration Type')
                    .addOptions([
                        {
                            label: '🎭 Role Permissions',
                            description: 'Configure permissions for Discord roles',
                            value: 'role_perms',
                            emoji: '🎭'
                        },
                        {
                            label: '📏 Line System Access',
                            description: 'Control who bot replies to with line',
                            value: 'line_access',
                            emoji: '📏'
                        }
                    ])
            );

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('perm_view_all')
                    .setLabel('View All')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📋'),
                new ButtonBuilder()
                    .setCustomId('perm_reset_to_default')
                    .setLabel('Reset to Default')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔄')
            );

        const updateMethod = interaction.replied || interaction.deferred ? 'update' : 'reply';
        await interaction[updateMethod]({ 
            embeds: [embed], 
            components: [mainMenu, buttons],
            ephemeral: false
        });

    } catch (error) {
        console.error('❌ Dashboard error:', error);
        await interaction.reply({
            embeds: [{
                color: 0xED4245,
                title: '❌ Error',
                description: `Failed to load dashboard:\n\`\`\`${error.message}\`\`\``,
                footer: { text: 'Crévion' }
            }],
            ephemeral: true
        }).catch(() => {});
    }
}

// ═══════════════════════════════════════════════════════════════
// 🎭 ROLE PERMISSIONS
// ═══════════════════════════════════════════════════════════════

async function showRolePermissions(interaction, client) {
    try {
        const levelMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('perm_select_level')
                    .setPlaceholder('🎯 Select Permission Level')
                    .addOptions([
                        { label: '⚙️ Admin', value: 'admin', emoji: '⚙️' },
                        { label: '🛡️ Moderator', value: 'moderator', emoji: '🛡️' },
                        { label: '💎 Helper', value: 'helper', emoji: '💎' },
                        { label: '⭐ VIP', value: 'vip', emoji: '⭐' },
                        { label: '👥 Member', value: 'member', emoji: '👥' }
                    ])
            );

        const embed = new EmbedBuilder()
            .setColor(0x370080)
            .setTitle('🎭 Role Permissions Configuration')
            .setDescription('Select a permission level to configure which Discord roles have that access.')
            .setFooter({ text: 'Changes save automatically' });

        await interaction.update({ embeds: [embed], components: [levelMenu, createBackButton()] });

    } catch (error) {
        console.error('❌ Role perms error:', error);
    }
}

async function showLevelConfig(interaction, level) {
    try {
        const dbConfig = await getConfig();
        const guildRoles = await interaction.guild.roles.fetch();
        
        const configuredRoleIds = dbConfig.permissions?.roles?.[level] || [];
        const configuredRoles = configuredRoleIds
            .map(id => guildRoles.get(id))
            .filter(Boolean);

        const levelInfo = {
            admin: { emoji: '⚙️', name: 'Admin', color: 0xED4245 },
            moderator: { emoji: '🛡️', name: 'Moderator', color: 0xFEE75C },
            helper: { emoji: '💎', name: 'Helper', color: 0x4A90E2 },
            vip: { emoji: '⭐', name: 'VIP', color: 0xFEE75C },
            member: { emoji: '👥', name: 'Member', color: 0x57F287 }
        };

        const info = levelInfo[level];

        const embed = new EmbedBuilder()
            .setColor(info.color)
            .setTitle(`${info.emoji} ${info.name} Permission Configuration`)
            .setDescription(`Configure which Discord roles get **${info.name}** permissions`)
            .addFields(
                {
                    name: '✅ Currently Assigned',
                    value: configuredRoles.length > 0 
                        ? configuredRoles.map(r => `• ${r}`).join('\n')
                        : '*No roles assigned*',
                    inline: false
                }
            )
            .setFooter({ text: 'Use menus below to add/remove roles' });

        const components = [];

        // Add menu
        const availableRoles = Array.from(guildRoles.values())
            .filter(r => !r.managed && r.name !== '@everyone' && !configuredRoleIds.includes(r.id))
            .sort((a, b) => b.position - a.position)
            .slice(0, 25);

        if (availableRoles.length > 0) {
            components.push(new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`perm_add_role_${level}`)
                        .setPlaceholder('➕ Add roles')
                        .setMinValues(1)
                        .setMaxValues(Math.min(availableRoles.length, 5))
                        .addOptions(
                            availableRoles.map(role => ({
                                label: role.name,
                                value: role.id,
                                emoji: info.emoji
                            }))
                        )
                )
            );
        }

        // Remove menu
        if (configuredRoles.length > 0) {
            components.push(new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`perm_remove_role_${level}`)
                        .setPlaceholder('🗑️ Remove roles')
                        .addOptions(
                            configuredRoles.map(role => ({
                                label: role.name,
                                value: role.id,
                                emoji: '🗑️'
                            }))
                        )
                )
            );
        }

        components.push(createBackButton());

        await interaction.update({ embeds: [embed], components });

    } catch (error) {
        console.error('❌ Level config error:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// 📏 LINE ACCESS
// ═══════════════════════════════════════════════════════════════

async function showLineAccess(interaction) {
    try {
        const dbConfig = await getConfig();
        const lineRoles = dbConfig.permissions?.lineAccess || [];
        const guildRoles = await interaction.guild.roles.fetch();
        
        const roleList = lineRoles
            .map(id => guildRoles.get(id))
            .filter(Boolean)
            .map(r => `• ${r}`)
            .join('\n') || '*No roles - Bot won\'t auto-reply*';

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('📏 Line System Access Control')
            .setDescription(
                '**Control who bot replies to with line**\n\n' +
                '⚠️ This is SEPARATE from `/line` commands!\n\n' +
                '**Auto-Reply Roles:**\n' + roleList
            )
            .setFooter({ text: '/line commands are Owner-only' });

        const availableRoles = Array.from(guildRoles.values())
            .filter(r => !r.managed && r.name !== '@everyone' && !lineRoles.includes(r.id))
            .slice(0, 25);

        const components = [];

        if (availableRoles.length > 0) {
            components.push(new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('perm_line_add')
                        .setPlaceholder('➕ Add roles to line access')
                        .setMinValues(1)
                        .setMaxValues(Math.min(availableRoles.length, 5))
                        .addOptions(
                            availableRoles.map(role => ({
                                label: role.name,
                                value: role.id,
                                emoji: '📏'
                            }))
                        )
                )
            );
        }

        if (lineRoles.length > 0) {
            const configuredRoles = lineRoles.map(id => guildRoles.get(id)).filter(Boolean);
            components.push(new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('perm_line_remove')
                        .setPlaceholder('🗑️ Remove roles')
                        .addOptions(
                            configuredRoles.map(role => ({
                                label: role.name,
                                value: role.id,
                                emoji: '🗑️'
                            }))
                        )
                )
            );
        }

        components.push(createBackButton());

        await interaction.update({ embeds: [embed], components });

    } catch (error) {
        console.error('❌ Line access error:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════════

export async function handlePermissionSelectMenu(interaction, client) {
    const value = interaction.values[0];

    if (value === 'role_perms') {
        await showRolePermissions(interaction, client);
    } else if (value === 'line_access') {
        await showLineAccess(interaction);
    } else {
        // It's a level selection
        await showLevelConfig(interaction, value);
    }
}

export async function handlePermissionButtons(interaction, client) {
    const customId = interaction.customId;

    if (customId === 'perm_back_to_main') {
        await showMainDashboard(interaction, client);
    } else if (customId === 'perm_reset_to_default') {
        await resetToDefault(interaction);
    } else if (customId === 'perm_view_all') {
        await showAllPermissions(interaction);
    }
}

export async function handleAddRoleToLevel(interaction, level, roleIds) {
    try {
        const dbConfig = await getConfig();
        const currentRoles = dbConfig.permissions?.roles?.[level] || [];
        const newRoles = [...new Set([...currentRoles, ...roleIds])];
        
        await updateConfig({ [`permissions.roles.${level}`]: newRoles });

        await interaction.reply({
            embeds: [{
                color: 0x57F287,
                title: '✅ Roles Added!',
                description: `Added ${roleIds.length} role(s) to **${level.toUpperCase()}**.`,
                footer: { text: 'Saved to database ✓' }
            }],
            ephemeral: true
        });
    } catch (error) {
        console.error('❌ Add role error:', error);
    }
}

export async function handleRemoveRoleFromLevel(interaction, level, roleIds) {
    try {
        const dbConfig = await getConfig();
        const currentRoles = dbConfig.permissions?.roles?.[level] || [];
        const newRoles = currentRoles.filter(id => !roleIds.includes(id));
        
        await updateConfig({ [`permissions.roles.${level}`]: newRoles });

        await interaction.reply({
            embeds: [{
                color: 0x57F287,
                title: '✅ Roles Removed!',
                description: `Removed ${roleIds.length} role(s) from **${level.toUpperCase()}**.`,
                footer: { text: 'Saved ✓' }
            }],
            ephemeral: true
        });
    } catch (error) {
        console.error('❌ Remove error:', error);
    }
}

export async function handleLineAccessAdd(interaction, roleIds) {
    try {
        const dbConfig = await getConfig();
        const current = dbConfig.permissions?.lineAccess || [];
        const updated = [...new Set([...current, ...roleIds])];
        
        await updateConfig({ 'permissions.lineAccess': updated });

        await interaction.reply({
            embeds: [{
                color: 0x57F287,
                title: '✅ Line Access Updated!',
                description: `Added ${roleIds.length} role(s) to line auto-reply.`,
                footer: { text: 'Saved ✓' }
            }],
            ephemeral: true
        });
    } catch (error) {
        console.error('❌ Line add error:', error);
    }
}

export async function handleLineAccessRemove(interaction, roleIds) {
    try {
        const dbConfig = await getConfig();
        const current = dbConfig.permissions?.lineAccess || [];
        const updated = current.filter(id => !roleIds.includes(id));
        
        await updateConfig({ 'permissions.lineAccess': updated });

        await interaction.reply({
            embeds: [{
                color: 0x57F287,
                title: '✅ Removed!',
                description: `Removed ${roleIds.length} role(s) from line access.`,
                footer: { text: 'Saved ✓' }
            }],
            ephemeral: true
        });
    } catch (error) {
        console.error('❌ Line remove error:', error);
    }
}

export async function handleResetConfirm(interaction) {
    await resetToDefault(interaction);
}

async function resetToDefault(interaction) {
    try {
        await updateConfig({ 'permissions': DEFAULT_PERMISSIONS });

        await interaction.update({
            embeds: [{
                color: 0x57F287,
                title: '✅ Reset Complete!',
                description: 'Permissions reset to default configuration.',
                footer: { text: 'Default loaded ✓' }
            }],
            components: []
        });
    } catch (error) {
        console.error('❌ Reset error:', error);
    }
}

async function showAllPermissions(interaction) {
    const dbConfig = await getConfig();
    
    const embed = new EmbedBuilder()
        .setColor(0x370080)
        .setTitle('📋 Complete Permissions Overview')
        .setDescription('Full system configuration')
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

function createBackButton() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('perm_back_to_main')
                .setLabel('◀️ Back')
                .setStyle(ButtonStyle.Secondary)
        );
}