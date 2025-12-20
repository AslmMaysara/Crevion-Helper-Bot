// // // src/commands/general/help.js

// // import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
// // import { config } from '../../config/config.js';
// // import { PermissionLevels, getPermissionLevelName, getUserPermissionLevel, getCommandRequiredLevel } from '../../utils/permissions.js';

// // export default {
// //     data: new SlashCommandBuilder()
// //         .setName('help')
// //         .setDescription('Display command list and help information')
// //         .addStringOption(option =>
// //             option
// //                 .setName('command')
// //                 .setDescription('Command name for detailed information')
// //                 .setRequired(false)
// //         ),

// //     permission: PermissionLevels.EVERYONE,
// //     prefixAlias: 'help',

// //     async execute(interaction, client) {
// //         const commandName = interaction.options?.getString('command');
// //         const member = await interaction.guild.members.fetch(interaction.user.id);
// //         const userLevel = getUserPermissionLevel(member);

// //         if (commandName) {
// //             return await showCommandDetails(interaction, client, commandName, userLevel);
// //         }

// //         await showMainHelp(interaction, client, userLevel);
// //     },

// //     async executePrefix(message, args, client) {
// //         const commandName = args[0];
// //         const member = await message.guild.members.fetch(message.author.id);
// //         const userLevel = getUserPermissionLevel(member);

// //         if (commandName) {
// //             const command = client.commands.get(commandName) || client.prefixCommands.get(commandName);
            
// //             if (!command) {
// //                 return await message.reply({
// //                     embeds: [{
// //                         color: config.settings.errorColor,
// //                         description: `❌ Command **${commandName}** not found`
// //                     }]
// //                 });
// //             }

// //             const embed = createCommandDetailEmbed(command, userLevel);
// //             return await message.reply({ embeds: [embed] });
// //         }

// //         const embed = createMainHelpEmbed(client, userLevel);
// //         const components = createHelpComponents(client, userLevel);
        
// //         await message.reply({ embeds: [embed], components });
// //     }
// // };

// // // Main help display
// // async function showMainHelp(interaction, client, userLevel) {
// //     const embed = createMainHelpEmbed(client, userLevel);
// //     const components = createHelpComponents(client, userLevel);

// //     await interaction.reply({
// //         embeds: [embed],
// //         components,
// //         ephemeral: false
// //     });
// // }

// // // Create main help embed
// // function createMainHelpEmbed(client, userLevel) {
// //     const categories = getCommandsByCategory(client, userLevel);
    
// //     const fields = [];
    
// //     for (const [category, commands] of Object.entries(categories)) {
// //         if (commands.length === 0) continue;
        
// //         const commandsList = commands.map(cmd => `\`${cmd.data.name}\``).join(' • ');
        
// //         fields.push({
// //             name: `${getCategoryEmoji(category)} ${getCategoryName(category)}`,
// //             value: commandsList || 'No commands available',
// //             inline: false
// //         });
// //     }

// //     return {
// //         color: config.settings.defaultColor,
// //         author: {
// //             name: `${config.about.name} - Command List`,
// //             icon_url: config.settings.embedThumbnail
// //         },
// //         description: `**${config.about.tagline}**\n\n${config.about.description}\n\n**Your Permission Level:** ${getPermissionLevelName(userLevel)}\n**Prefix:** \`${config.settings.prefix}\` or \`/\` (slash commands)`,
// //         fields,
// //         thumbnail: { url: config.settings.embedThumbnail },
// //         footer: {
// //             text: `${config.settings.embedFooter} | Use /help [command] for more details`,
// //             icon_url: config.settings.embedFooterIcon
// //         },
// //         timestamp: new Date()
// //     };
// // }

// // // Create help components
// // function createHelpComponents(client, userLevel) {
// //     const categories = getCommandsByCategory(client, userLevel);
    
// //     const selectMenu = new StringSelectMenuBuilder()
// //         .setCustomId('help_category')
// //         .setPlaceholder('🔍 Select a category to view commands')
// //         .addOptions(
// //             Object.keys(categories).filter(cat => categories[cat].length > 0).map(cat => ({
// //                 label: getCategoryName(cat),
// //                 description: `View ${getCategoryName(cat)} commands`,
// //                 value: cat,
// //                 emoji: getCategoryEmoji(cat)
// //             }))
// //         );

// //     const buttons = new ActionRowBuilder()
// //         .addComponents(
// //             new ButtonBuilder()
// //                 .setLabel('Website')
// //                 .setStyle(ButtonStyle.Link)
// //                 .setURL(config.about.website)
// //                 .setEmoji('🌐'),
// //             new ButtonBuilder()
// //                 .setLabel('Support Server')
// //                 .setStyle(ButtonStyle.Link)
// //                 .setURL(config.about.supportServer)
// //                 .setEmoji('💬'),
// //             new ButtonBuilder()
// //                 .setLabel('Bot Info')
// //                 .setCustomId('bot_info')
// //                 .setStyle(ButtonStyle.Secondary)
// //                 .setEmoji('ℹ️')
// //         );

// //     return [
// //         new ActionRowBuilder().addComponents(selectMenu),
// //         buttons
// //     ];
// // }

// // // Show command details
// // async function showCommandDetails(interaction, client, commandName, userLevel) {
// //     const command = client.commands.get(commandName);
    
// //     if (!command) {
// //         return await interaction.reply({
// //             embeds: [{
// //                 color: config.settings.errorColor,
// //                 description: `❌ Command **${commandName}** not found`
// //             }],
// //             ephemeral: true
// //         });
// //     }

// //     const embed = createCommandDetailEmbed(command, userLevel);
// //     await interaction.reply({ embeds: [embed], ephemeral: false });
// // }

// // // Create command detail embed
// // function createCommandDetailEmbed(command, userLevel) {
// //     const requiredLevel = getCommandRequiredLevel(command.data.name, command.permission || PermissionLevels.EVERYONE);
// //     const hasAccess = userLevel >= requiredLevel;

// //     const fields = [
// //         {
// //             name: '📝 Description',
// //             value: command.data.description || 'No description available',
// //             inline: false
// //         }
// //     ];

// //     // Required permissions
// //     fields.push({
// //         name: '🔐 Required Permission',
// //         value: `${getPermissionLevelName(requiredLevel)} ${hasAccess ? '✅' : '❌'}`,
// //         inline: true
// //     });

// //     fields.push({
// //         name: '📂 Category',
// //         value: getCategoryFromPermission(requiredLevel),
// //         inline: true
// //     });

// //     // Usage
// //     let usage = `\`/${command.data.name}`;
// //     if (command.data.options && command.data.options.length > 0) {
// //         const options = command.data.options.map(opt => 
// //             opt.required ? `<${opt.name}>` : `[${opt.name}]`
// //         ).join(' ');
// //         usage += ` ${options}`;
// //     }
// //     usage += '`';

// //     if (command.prefixAlias) {
// //         usage += `\nPrefix: \`${config.settings.prefix}${command.prefixAlias}\``;
// //     }

// //     fields.push({
// //         name: '💬 Usage',
// //         value: usage,
// //         inline: false
// //     });

// //     // Options/Parameters
// //     if (command.data.options && command.data.options.length > 0) {
// //         const optionsText = command.data.options.map(opt => {
// //             const required = opt.required ? '**[Required]**' : '*[Optional]*';
// //             return `• **${opt.name}** ${required}\n  └ ${opt.description}`;
// //         }).join('\n\n');

// //         fields.push({
// //             name: '⚙️ Parameters',
// //             value: optionsText,
// //             inline: false
// //         });
// //     }

// //     // Examples
// //     const examples = getCommandExamples(command.data.name);
// //     if (examples) {
// //         fields.push({
// //             name: '💡 Examples',
// //             value: examples,
// //             inline: false
// //         });
// //     }

// //     return {
// //         color: hasAccess ? config.settings.defaultColor : config.settings.errorColor,
// //         title: `📌 Command Info: ${command.data.name}`,
// //         fields,
// //         thumbnail: { url: config.settings.embedThumbnail },
// //         footer: {
// //             text: config.settings.embedFooter,
// //             icon_url: config.settings.embedFooterIcon
// //         },
// //         timestamp: new Date()
// //     };
// // }

// // // Categorize commands
// // function getCommandsByCategory(client, userLevel) {
// //     const categories = {
// //         general: [],
// //         moderation: [],
// //         creator: [],
// //         owner: []
// //     };

// //     client.commands.forEach(cmd => {
// //         const requiredLevel = getCommandRequiredLevel(cmd.data.name, cmd.permission || PermissionLevels.EVERYONE);
        
// //         // Hide commands user doesn't have permission for
// //         if (userLevel < requiredLevel) {
// //             return;
// //         }

// //         let category = 'general';
        
// //         if (requiredLevel >= PermissionLevels.OWNER) {
// //             category = 'owner';
// //         } else if (requiredLevel >= PermissionLevels.MODERATOR) {
// //             category = 'moderation';
// //         } else if (requiredLevel >= PermissionLevels.HELPER) {
// //             category = 'creator';
// //         }

// //         if (categories[category]) {
// //             categories[category].push(cmd);
// //         }
// //     });

// //     return categories;
// // }

// // // Category emojis
// // function getCategoryEmoji(category) {
// //     const emojis = {
// //         general: '📂',
// //         moderation: '🛡️',
// //         creator: '🎨',
// //         owner: '👑'
// //     };
// //     return emojis[category] || '📁';
// // }

// // // Category names
// // function getCategoryName(category) {
// //     const names = {
// //         general: 'General Commands',
// //         moderation: 'Moderation',
// //         creator: 'Creator Tools',
// //         owner: 'Owner Only'
// //     };
// //     return names[category] || category;
// // }

// // // Get category from permission level
// // function getCategoryFromPermission(level) {
// //     if (level >= PermissionLevels.OWNER) return 'Owner Only';
// //     if (level >= PermissionLevels.MODERATOR) return 'Moderation';
// //     if (level >= PermissionLevels.HELPER) return 'Creator Tools';
// //     return 'General';
// // }

// // // Command examples
// // function getCommandExamples(commandName) {
// //     const examples = {
// //         'help': '`/help` - View all commands\n`/help ping` - View ping command details',
// //         'ping': '`/ping` - Check bot latency',
// //         'info': '`/info` - View bot information',
// //         'stats': '`/stats` - View detailed statistics',
// //         'line': '`/line url:https://example.com/image.png` - Set font image',
// //         'permissions': '`/permissions user @user moderator` - Set user permission\n`/permissions command ping admin` - Set command permission'
// //     };
// //     return examples[commandName] || null;
// // }

// // src/commands/general/help.js - Fixed Bot Info Button

// import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
// import { getConfig } from '../../models/index.js';
// import { PermissionLevels, getPermissionLevelName, getUserPermissionLevel, getCommandRequiredLevel } from '../../utils/permissions.js';

// export default {
//     data: new SlashCommandBuilder()
//         .setName('help')
//         .setDescription('Display command list and help information')
//         .addStringOption(option =>
//             option
//                 .setName('command')
//                 .setDescription('Command name for detailed information')
//                 .setRequired(false)
//         ),

//     permission: PermissionLevels.EVERYONE,
//     prefixAlias: 'help',

//     async execute(interaction, client) {
//         const commandName = interaction.options?.getString('command');
//         const member = await interaction.guild.members.fetch(interaction.user.id);
//         const userLevel = getUserPermissionLevel(member);

//         if (commandName) {
//             return await showCommandDetails(interaction, client, commandName, userLevel);
//         }

//         await showMainHelp(interaction, client, userLevel);
//     },

//     async executePrefix(message, args, client) {
//         const commandName = args[0];
//         const member = await message.guild.members.fetch(message.author.id);
//         const userLevel = getUserPermissionLevel(member);

//         if (commandName) {
//             const command = client.commands.get(commandName) || client.prefixCommands.get(commandName);
            
//             if (!command) {
//                 return await message.reply({
//                     embeds: [{
//                         color: 0xED4245,
//                         description: `❌ Command **${commandName}** not found`
//                     }],
//                     allowedMentions: { repliedUser: false }
//                 });
//             }

//             const embed = await createCommandDetailEmbed(command, userLevel, client);
//             return await message.reply({ 
//                 embeds: [embed],
//                 allowedMentions: { repliedUser: false }
//             });
//         }

//         const embed = await createMainHelpEmbed(client, userLevel);
//         const components = createHelpComponents(client, userLevel);
        
//         await message.reply({ 
//             embeds: [embed], 
//             components,
//             allowedMentions: { repliedUser: false }
//         });
//     }
// };

// // Main help display
// async function showMainHelp(interaction, client, userLevel) {
//     const embed = await createMainHelpEmbed(client, userLevel);
//     const components = createHelpComponents(client, userLevel);

//     await interaction.reply({
//         embeds: [embed],
//         components,
//         ephemeral: false
//     });
// }

// // Create main help embed
// async function createMainHelpEmbed(client, userLevel) {
//     const dbConfig = await getConfig();
//     const categories = getCommandsByCategory(client, userLevel);
    
//     const fields = [];
    
//     for (const [category, commands] of Object.entries(categories)) {
//         if (commands.length === 0) continue;
        
//         const commandsList = commands.map(cmd => `\`${cmd.data.name}\``).join(' • ');
        
//         fields.push({
//             name: `${getCategoryEmoji(category)} ${getCategoryName(category)}`,
//             value: commandsList || 'No commands available',
//             inline: false
//         });
//     }

//     return {
//         color: parseInt(dbConfig?.embedSettings?.defaultColor?.replace('#', '') || '370080', 16),
//         author: {
//             name: `${dbConfig?.botName || 'Crévion'} - Command List`,
//             icon_url: dbConfig?.embedSettings?.thumbnail
//         },
//         description: `**${dbConfig?.botName || 'Crévion'} - Your Creative Assistant**\n\nصنع بلمسة من الابداع خصيصا للمبدعين العرب\n\n**Your Permission Level:** ${getPermissionLevelName(userLevel)}\n**Prefix:** \`${dbConfig?.prefix || '-'}\` or \`/\` (slash commands)`,
//         fields,
//         thumbnail: { url: dbConfig?.embedSettings?.thumbnail },
//         footer: {
//             text: `${dbConfig?.embedSettings?.footer} | Use /help [command] for more details`,
//             icon_url: dbConfig?.embedSettings?.footerIcon
//         },
//         timestamp: new Date()
//     };
// }

// // Create help components
// function createHelpComponents(client, userLevel) {
//     const categories = getCommandsByCategory(client, userLevel);
    
//     const selectMenu = new StringSelectMenuBuilder()
//         .setCustomId('help_category')
//         .setPlaceholder('🔍 Select a category to view commands')
//         .addOptions(
//             Object.keys(categories).filter(cat => categories[cat].length > 0).map(cat => ({
//                 label: getCategoryName(cat),
//                 description: `View ${getCategoryName(cat)} commands`,
//                 value: cat,
//                 emoji: getCategoryEmoji(cat)
//             }))
//         );

//     const buttons = new ActionRowBuilder()
//         .addComponents(
//             new ButtonBuilder()
//                 .setLabel('Website')
//                 .setStyle(ButtonStyle.Link)
//                 .setURL('https://crevion.qzz.io')
//                 .setEmoji('🌐'),
//             new ButtonBuilder()
//                 .setLabel('Support Server')
//                 .setStyle(ButtonStyle.Link)
//                 .setURL('https://discord.gg/mP9apCqDSZ')
//                 .setEmoji('💬'),
//             new ButtonBuilder()
//                 .setLabel('Bot Info')
//                 .setCustomId('bot_info')
//                 .setStyle(ButtonStyle.Secondary)
//                 .setEmoji('ℹ️')
//         );

//     return [
//         new ActionRowBuilder().addComponents(selectMenu),
//         buttons
//     ];
// }

// // Show command details
// async function showCommandDetails(interaction, client, commandName, userLevel) {
//     const command = client.commands.get(commandName);
    
//     if (!command) {
//         return await interaction.reply({
//             embeds: [{
//                 color: 0xED4245,
//                 description: `❌ Command **${commandName}** not found`
//             }],
//             ephemeral: true
//         });
//     }

//     const embed = await createCommandDetailEmbed(command, userLevel, client);
//     await interaction.reply({ embeds: [embed], ephemeral: false });
// }

// // Create command detail embed
// async function createCommandDetailEmbed(command, userLevel, client) {
//     const dbConfig = await getConfig();
//     const requiredLevel = getCommandRequiredLevel(command.data.name, command.permission || PermissionLevels.EVERYONE);
//     const hasAccess = userLevel >= requiredLevel;

//     const fields = [
//         {
//             name: '📝 Description',
//             value: command.data.description || 'No description available',
//             inline: false
//         }
//     ];

//     // Required permissions
//     fields.push({
//         name: '🔐 Required Permission',
//         value: `${getPermissionLevelName(requiredLevel)} ${hasAccess ? '✅' : '❌'}`,
//         inline: true
//     });

//     fields.push({
//         name: '📂 Category',
//         value: getCategoryFromPermission(requiredLevel),
//         inline: true
//     });

//     // Usage
//     let usage = `\`/${command.data.name}`;
//     if (command.data.options && command.data.options.length > 0) {
//         const options = command.data.options.map(opt => 
//             opt.required ? `<${opt.name}>` : `[${opt.name}]`
//         ).join(' ');
//         usage += ` ${options}`;
//     }
//     usage += '`';

//     if (command.prefixAlias) {
//         usage += `\nPrefix: \`${dbConfig?.prefix || '-'}${command.prefixAlias}\``;
//     }

//     fields.push({
//         name: '💬 Usage',
//         value: usage,
//         inline: false
//     });

//     // Options/Parameters
//     if (command.data.options && command.data.options.length > 0) {
//         const optionsText = command.data.options.map(opt => {
//             const required = opt.required ? '**[Required]**' : '*[Optional]*';
//             return `• **${opt.name}** ${required}\n  └ ${opt.description}`;
//         }).join('\n\n');

//         fields.push({
//             name: '⚙️ Parameters',
//             value: optionsText,
//             inline: false
//         });
//     }

//     // Examples
//     const examples = getCommandExamples(command.data.name);
//     if (examples) {
//         fields.push({
//             name: '💡 Examples',
//             value: examples,
//             inline: false
//         });
//     }

//     const defaultColor = parseInt(dbConfig?.embedSettings?.defaultColor?.replace('#', '') || '370080', 16);
//     const errorColor = parseInt(dbConfig?.embedSettings?.errorColor?.replace('#', '') || 'ED4245', 16);

//     return {
//         color: hasAccess ? defaultColor : errorColor,
//         title: `📌 Command Info: ${command.data.name}`,
//         fields,
//         thumbnail: { url: dbConfig?.embedSettings?.thumbnail },
//         footer: {
//             text: dbConfig?.embedSettings?.footer,
//             icon_url: dbConfig?.embedSettings?.footerIcon
//         },
//         timestamp: new Date()
//     };
// }

// // Categorize commands
// function getCommandsByCategory(client, userLevel) {
//     const categories = {
//         general: [],
//         moderation: [],
//         creator: [],
//         owner: []
//     };

//     client.commands.forEach(cmd => {
//         const requiredLevel = getCommandRequiredLevel(cmd.data.name, cmd.permission || PermissionLevels.EVERYONE);
        
//         // Hide commands user doesn't have permission for
//         if (userLevel < requiredLevel) {
//             return;
//         }

//         let category = 'general';
        
//         if (requiredLevel >= PermissionLevels.OWNER) {
//             category = 'owner';
//         } else if (requiredLevel >= PermissionLevels.MODERATOR) {
//             category = 'moderation';
//         } else if (requiredLevel >= PermissionLevels.HELPER) {
//             category = 'creator';
//         }

//         if (categories[category]) {
//             categories[category].push(cmd);
//         }
//     });

//     return categories;
// }

// // Category emojis
// function getCategoryEmoji(category) {
//     const emojis = {
//         general: '📂',
//         moderation: '🛡️',
//         creator: '🎨',
//         owner: '👑'
//     };
//     return emojis[category] || '📁';
// }

// // Category names
// function getCategoryName(category) {
//     const names = {
//         general: 'General Commands',
//         moderation: 'Moderation',
//         creator: 'Creator Tools',
//         owner: 'Owner Only'
//     };
//     return names[category] || category;
// }

// // Get category from permission level
// function getCategoryFromPermission(level) {
//     if (level >= PermissionLevels.OWNER) return 'Owner Only';
//     if (level >= PermissionLevels.MODERATOR) return 'Moderation';
//     if (level >= PermissionLevels.HELPER) return 'Creator Tools';
//     return 'General';
// }

// // Command examples
// function getCommandExamples(commandName) {
//     const examples = {
//         'help': '`/help` - View all commands\n`/help ping` - View ping command details',
//         'ping': '`/ping` - Check bot latency',
//         'info': '`/info` - View bot information',
//         'stats': '`/stats` - View detailed statistics',
//         'line': '`/line url:https://example.com/image.png` - Set font image',
//         'permissions': '`/permissions user @user moderator` - Set user permission\n`/permissions command ping admin` - Set command permission'
//     };
//     return examples[commandName] || null;
// }
// src/commands/general/help.js - Advanced Help System

import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { getConfig } from '../../models/index.js';
import { PermissionLevels, getPermissionLevelName, getUserPermissionLevel } from '../../utils/permissions.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display command list and help information')
        .addStringOption(option =>
            option
                .setName('command')
                .setDescription('Command name for detailed information')
                .setRequired(false)
        ),

    permission: PermissionLevels.EVERYONE,
    prefixAlias: 'help',

    async execute(interaction, client) {
        const commandName = interaction.options?.getString('command');
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const userLevel = await getUserPermissionLevel(member);

        if (commandName) {
            return await showCommandDetails(interaction, client, commandName, userLevel);
        }

        await showMainHelp(interaction, client, userLevel);
    },

    async executePrefix(message, args, client) {
        const commandName = args[0];
        const member = await message.guild.members.fetch(message.author.id);
        const userLevel = await getUserPermissionLevel(member);

        if (commandName) {
            const command = client.commands.get(commandName) || client.prefixCommands.get(commandName);
            
            if (!command) {
                return await message.reply({
                    embeds: [{
                        color: 0xED4245,
                        description: `❌ Command **${commandName}** not found`
                    }],
                    allowedMentions: { repliedUser: false }
                });
            }

            const embed = await createCommandDetailEmbed(command, userLevel, client);
            return await message.reply({ 
                embeds: [embed],
                allowedMentions: { repliedUser: false }
            });
        }

        const embed = await createMainHelpEmbed(client, userLevel);
        const components = createHelpComponents(client, userLevel);
        
        await message.reply({ 
            embeds: [embed], 
            components,
            allowedMentions: { repliedUser: false }
        });
    }
};

// Main help display
async function showMainHelp(interaction, client, userLevel) {
    const embed = await createMainHelpEmbed(client, userLevel);
    const components = createHelpComponents(client, userLevel);

    await interaction.reply({
        embeds: [embed],
        components,
        ephemeral: false
    });
}

// Create main help embed
async function createMainHelpEmbed(client, userLevel) {
    const dbConfig = await getConfig();
    const categories = getCommandsByCategory(client, userLevel);
    
    const fields = [];
    
    // Define category order and visibility based on user level
    const categoryConfig = {
        general: { name: '📂 General Commands', emoji: '📂', minLevel: PermissionLevels.EVERYONE },
        creativity: { name: '🎨 Showcase & Creativity', emoji: '🎨', minLevel: PermissionLevels.EVERYONE },
        moderation: { name: '🛡️ Moderation', emoji: '🛡️', minLevel: PermissionLevels.MODERATOR },
        admin: { name: '⚙️ Administration', emoji: '⚙️', minLevel: PermissionLevels.ADMIN },
        owner: { name: '👑 Owner Only', emoji: '👑', minLevel: PermissionLevels.OWNER }
    };

    for (const [categoryKey, config] of Object.entries(categoryConfig)) {
        // Only show categories user has access to
        if (userLevel < config.minLevel) continue;
        
        const commands = categories[categoryKey] || [];
        if (commands.length === 0) continue;
        
        const commandsList = commands
            .slice(0, 10) // Limit to 10 commands per category in main view
            .map(cmd => `\`${cmd.data.name}\``)
            .join(' • ');
        
        fields.push({
            name: config.name,
            value: commandsList + (commands.length > 10 ? ` • **+${commands.length - 10} more**` : ''),
            inline: false
        });
    }

    // Add stats footer
    const totalAccessible = Object.values(categories).reduce((sum, cmds) => sum + cmds.length, 0);

    const embed = new EmbedBuilder()
        .setColor(parseInt(dbConfig?.embedSettings?.defaultColor?.replace('#', '') || '370080', 16))
        .setAuthor({
            name: `${dbConfig?.botName || 'Crévion'} - Command List`,
            iconURL: dbConfig?.embedSettings?.thumbnail
        })
        .setTitle('✨ صنع بلمسة من الابداع خصيصا للمبدعين العرب')
        .setDescription(
            `مرحباً! أنا **${dbConfig?.botName || 'Crévion'}**، بوت مصمم خصيصاً لمجتمع Crevion.\n\n` +
            `**🔑 Your Permission Level:** ${getPermissionLevelName(userLevel)}\n` +
            `**📊 Accessible Commands:** ${totalAccessible}\n` +
            `**📌 Prefix:** \`${dbConfig?.prefix || '-'}\` or \`/\` (slash commands)\n\n` +
            `**💡 Tip:** Use the dropdown below to explore categories, or use \`/help [command]\` for details.`
        )
        .addFields(fields)
        .setThumbnail(dbConfig?.embedSettings?.thumbnail)
        .setFooter({
            text: `${dbConfig?.embedSettings?.footer} | Requested by ${userLevel >= PermissionLevels.OWNER ? 'Owner' : userLevel >= PermissionLevels.ADMIN ? 'Admin' : 'Member'}`,
            iconURL: dbConfig?.embedSettings?.footerIcon
        })
        .setTimestamp();

    return embed;
}

// Create help components (dropdown + buttons)
function createHelpComponents(client, userLevel) {
    const categories = getCommandsByCategory(client, userLevel);
    
    // Create dropdown options based on user level
    const options = [];
    
    if (categories.general?.length > 0) {
        options.push({
            label: 'General Commands',
            description: `${categories.general.length} commands available`,
            value: 'general',
            emoji: '📂'
        });
    }
    
    if (categories.creativity?.length > 0) {
        options.push({
            label: 'Showcase & Creativity',
            description: `${categories.creativity.length} creative tools`,
            value: 'creativity',
            emoji: '🎨'
        });
    }
    
    if (userLevel >= PermissionLevels.MODERATOR && categories.moderation?.length > 0) {
        options.push({
            label: 'Moderation',
            description: `${categories.moderation.length} moderation commands`,
            value: 'moderation',
            emoji: '🛡️'
        });
    }
    
    if (userLevel >= PermissionLevels.ADMIN && categories.admin?.length > 0) {
        options.push({
            label: 'Administration',
            description: `${categories.admin.length} admin commands`,
            value: 'admin',
            emoji: '⚙️'
        });
    }
    
    if (userLevel >= PermissionLevels.OWNER && categories.owner?.length > 0) {
        options.push({
            label: 'Owner Only',
            description: `${categories.owner.length} owner commands`,
            value: 'owner',
            emoji: '👑'
        });
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('help_category')
        .setPlaceholder('🔍 Select a category to view commands')
        .addOptions(options);

    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Website')
                .setStyle(ButtonStyle.Link)
                .setURL('https://crevion.qzz.io')
                .setEmoji('🌐'),
            new ButtonBuilder()
                .setLabel('Support Server')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/mP9apCqDSZ')
                .setEmoji('💬'),
            new ButtonBuilder()
                .setLabel('Bot Info')
                .setCustomId('bot_info')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('ℹ️')
        );

    return [
        new ActionRowBuilder().addComponents(selectMenu),
        buttons
    ];
}

// Show command details
async function showCommandDetails(interaction, client, commandName, userLevel) {
    const command = client.commands.get(commandName);
    
    if (!command) {
        return await interaction.reply({
            embeds: [{
                color: 0xED4245,
                description: `❌ Command **${commandName}** not found`
            }],
            ephemeral: true
        });
    }

    const embed = await createCommandDetailEmbed(command, userLevel, client);
    await interaction.reply({ embeds: [embed], ephemeral: false });
}

// Create command detail embed
async function createCommandDetailEmbed(command, userLevel, client) {
    const dbConfig = await getConfig();
    const requiredLevel = command.permission !== undefined ? command.permission : PermissionLevels.EVERYONE;
    const hasAccess = userLevel >= requiredLevel;

    const fields = [
        {
            name: '📝 Description',
            value: command.data.description || 'No description available',
            inline: false
        }
    ];

    // Required permissions
    fields.push({
        name: '🔐 Required Permission',
        value: `${getPermissionLevelName(requiredLevel)} ${hasAccess ? '✅ You have access' : '❌ No access'}`,
        inline: true
    });

    fields.push({
        name: '📂 Category',
        value: getCategoryFromPermission(requiredLevel),
        inline: true
    });

    // Usage
    let usage = `\`/${command.data.name}`;
    if (command.data.options && command.data.options.length > 0) {
        const options = command.data.options.map(opt => 
            opt.required ? `<${opt.name}>` : `[${opt.name}]`
        ).join(' ');
        usage += ` ${options}`;
    }
    usage += '`';

    if (command.prefixAlias) {
        usage += `\n**Prefix:** \`${dbConfig?.prefix || '-'}${command.prefixAlias}\``;
    }

    fields.push({
        name: '💬 Usage',
        value: usage,
        inline: false
    });

    // Options/Parameters
    if (command.data.options && command.data.options.length > 0) {
        const optionsText = command.data.options.map(opt => {
            const required = opt.required ? '**[Required]**' : '*[Optional]*';
            return `• **${opt.name}** ${required}\n  └ ${opt.description}`;
        }).join('\n\n');

        fields.push({
            name: '⚙️ Parameters',
            value: optionsText,
            inline: false
        });
    }

    // Examples
    const examples = getCommandExamples(command.data.name, dbConfig?.prefix);
    if (examples) {
        fields.push({
            name: '💡 Examples',
            value: examples,
            inline: false
        });
    }

    const defaultColor = parseInt(dbConfig?.embedSettings?.defaultColor?.replace('#', '') || '370080', 16);
    const errorColor = parseInt(dbConfig?.embedSettings?.errorColor?.replace('#', '') || 'ED4245', 16);

    return new EmbedBuilder()
        .setColor(hasAccess ? defaultColor : errorColor)
        .setTitle(`📌 Command Info: ${command.data.name}`)
        .addFields(fields)
        .setThumbnail(dbConfig?.embedSettings?.thumbnail)
        .setFooter({
            text: dbConfig?.embedSettings?.footer,
            iconURL: dbConfig?.embedSettings?.footerIcon
        })
        .setTimestamp();
}

// Categorize commands by user permission level
function getCommandsByCategory(client, userLevel) {
    const categories = {
        general: [],
        creativity: [],
        moderation: [],
        admin: [],
        owner: []
    };

    client.commands.forEach(cmd => {
        const requiredLevel = cmd.permission !== undefined ? cmd.permission : PermissionLevels.EVERYONE;
        
        // Hide commands user doesn't have permission for
        if (userLevel < requiredLevel) {
            return;
        }

        // Categorize based on command name and permission
        if (requiredLevel >= PermissionLevels.OWNER) {
            categories.owner.push(cmd);
        } else if (requiredLevel >= PermissionLevels.ADMIN) {
            categories.admin.push(cmd);
        } else if (requiredLevel >= PermissionLevels.MODERATOR) {
            categories.moderation.push(cmd);
        } else if (cmd.data.name.includes('showcase') || cmd.data.name.includes('color') || cmd.data.name.includes('line')) {
            categories.creativity.push(cmd);
        } else {
            categories.general.push(cmd);
        }
    });

    return categories;
}

// Get category from permission level
function getCategoryFromPermission(level) {
    if (level >= PermissionLevels.OWNER) return '👑 Owner Only';
    if (level >= PermissionLevels.ADMIN) return '⚙️ Administration';
    if (level >= PermissionLevels.MODERATOR) return '🛡️ Moderation';
    if (level >= PermissionLevels.HELPER) return '🎨 Showcase & Creativity';
    return '📂 General';
}

// Command examples
function getCommandExamples(commandName, prefix = '-') {
    const examples = {
        'help': `\`/help\` - View all commands\n\`/help ping\` - View ping command details`,
        'ping': `\`/ping\` - Check bot latency`,
        'info': `\`/info\` - View bot information`,
        'stats': `\`/stats\` - View detailed statistics`,
        'line': `\`/line set https://example.com/image.png\` - Set line image\n\`${prefix}line test\` - Test current line`,
        'config': `\`/config view\` - View configuration\n\`/config set-prefix !\` - Change prefix to !`,
        'challenges': `\`/challenges status\` - Check challenge system\n\`/challenges post-now\` - Post challenge immediately`,
        'permissions': `\`/permissions user @user moderator\` - Set user permission`
    };
    return examples[commandName] || null;
}