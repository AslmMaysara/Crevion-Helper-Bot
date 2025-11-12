import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { PermissionLevels } from '../../utils/permissions.js';
import { config } from '../../config/config.js';

const CHANNELS = {
    codes: '1424814715439288454',
    projects: '1435190203798126602'
};

export default {
    data: new SlashCommandBuilder()
        .setName('showcase')
        .setDescription('Share your amazing work with the community')
        .addSubcommand(sub =>
            sub.setName('code')
                .setDescription('Share a code snippet or script')
                // ✅ Required options first
                .addStringOption(opt => opt
                    .setName('name')
                    .setDescription('Code/Script name')
                    .setRequired(true))
                .addStringOption(opt => opt
                    .setName('language')
                    .setDescription('Programming language')
                    .setRequired(true)
                    .addChoices(
                        { name: 'JavaScript', value: 'javascript' },
                        { name: 'TypeScript', value: 'typescript' },
                        { name: 'Python', value: 'python' },
                        { name: 'Node.js', value: 'nodejs' },
                        { name: 'Java', value: 'java' },
                        { name: 'C++', value: 'cpp' },
                        { name: 'C#', value: 'csharp' },
                        { name: 'PHP', value: 'php' },
                        { name: 'Ruby', value: 'ruby' },
                        { name: 'Go', value: 'go' },
                        { name: 'Rust', value: 'rust' },
                        { name: 'HTML/CSS', value: 'html' },
                        { name: 'SQL', value: 'sql' },
                        { name: 'Other', value: 'other' }
                    ))
                .addStringOption(opt => opt
                    .setName('description')
                    .setDescription('What does this code do?')
                    .setRequired(true))
                .addStringOption(opt => opt
                    .setName('code')
                    .setDescription('The code snippet (use \\n for new lines)')
                    .setRequired(true))
                // ✅ Optional options last
                .addStringOption(opt => opt
                    .setName('usage')
                    .setDescription('How to use it')
                    .setRequired(false))
                .addStringOption(opt => opt
                    .setName('version')
                    .setDescription('Version (e.g., 1.0.0)')
                    .setRequired(false))
                .addStringOption(opt => opt
                    .setName('github')
                    .setDescription('GitHub repository URL')
                    .setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('project')
                .setDescription('Share a full project')
                // ✅ Required options first
                .addStringOption(opt => opt
                    .setName('name')
                    .setDescription('Project name')
                    .setRequired(true))
                .addStringOption(opt => opt
                    .setName('type')
                    .setDescription('Project type')
                    .setRequired(true)
                    .addChoices(
                        { name: '🌐 Web Application', value: 'web' },
                        { name: '📱 Mobile App', value: 'mobile' },
                        { name: '🎮 Game', value: 'game' },
                        { name: '🤖 Bot/Automation', value: 'bot' },
                        { name: '🛠️ Tool/Utility', value: 'tool' },
                        { name: '📚 Library/Framework', value: 'library' },
                        { name: '🎨 Design System', value: 'design' },
                        { name: '💻 Other', value: 'other' }
                    ))
                .addStringOption(opt => opt
                    .setName('description')
                    .setDescription('Project description')
                    .setRequired(true))
                .addStringOption(opt => opt
                    .setName('technologies')
                    .setDescription('Technologies used (comma separated)')
                    .setRequired(true))
                // ✅ Optional options last
                .addStringOption(opt => opt
                    .setName('features')
                    .setDescription('Key features (comma separated)')
                    .setRequired(false))
                .addStringOption(opt => opt
                    .setName('version')
                    .setDescription('Current version')
                    .setRequired(false))
                .addStringOption(opt => opt
                    .setName('github')
                    .setDescription('GitHub repository URL')
                    .setRequired(false))
                .addStringOption(opt => opt
                    .setName('demo')
                    .setDescription('Live demo URL')
                    .setRequired(false))
                .addStringOption(opt => opt
                    .setName('license')
                    .setDescription('License type (MIT, GPL, etc.)')
                    .setRequired(false))
        ),

    permission: PermissionLevels.VIP, // VIP+ can showcase (creators)

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'code') {
            await handleCodeShowcase(interaction, client);
        } else if (subcommand === 'project') {
            await handleProjectShowcase(interaction, client);
        }
    }
};

async function handleCodeShowcase(interaction, client) {
    const name = interaction.options.getString('name');
    const language = interaction.options.getString('language');
    const description = interaction.options.getString('description');
    let code = interaction.options.getString('code');
    const usage = interaction.options.getString('usage');
    const version = interaction.options.getString('version');
    const github = interaction.options.getString('github');

    // Handle newlines
    code = code.replace(/\\n/g, '\n');

    try {
        const channel = await client.channels.fetch(CHANNELS.codes);
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({
                name: `${interaction.user.username} shared a code snippet`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTitle(`\`${name}\` ${getLanguageEmoji(language)}`)
            .setDescription(description)
            .addFields(
                { name: '📝 Language', value: `\`${language.toUpperCase()}\``, inline: true },
                { name: '👤 Author', value: `<@${interaction.user.id}>`, inline: true }
            );

        if (version) {
            embed.addFields({ name: '🏷️ Version', value: `\`${version}\``, inline: true });
        }

        if (usage) {
            embed.addFields({ name: '💡 Usage', value: usage.substring(0, 1024), inline: false });
        }

        // Handle code display - split if needed
        if (code.length > 1000) {
            // If code is too long, provide GitHub link or truncate
            if (github) {
                embed.addFields({
                    name: '```Code (View on GitHub)```',
                    value: `Code is too long to display here. [View on GitHub](${github})`,
                    inline: false
                });
            } else {
                const truncated = code.substring(0, 900);
                embed.addFields({
                    name: '```Code Preview (Truncated)```',
                    value: `\`\`\`${language}\n${truncated}\n... (truncated)\n\`\`\``,
                    inline: false
                });
            }
        } else {
            embed.addFields({
                name: '```Code```',
                value: `\`\`\`${language}\n${code}\n\`\`\``,
                inline: false
            });
        }

        embed.setFooter({
            text: `${config.settings.embedFooter} | Shared on`,
            icon_url: config.settings.embedFooterIcon
        });
        embed.setTimestamp();

        // Enhanced Buttons
        const buttons = new ActionRowBuilder();
        
        if (github) {
            buttons.addComponents(
                new ButtonBuilder()
                    .setLabel('GitHub')
                    .setStyle(ButtonStyle.Link)
                    .setURL(github)
                    .setEmoji('📦')
            );
        }

        // Contact author via Discord DM link
        buttons.addComponents(
            new ButtonBuilder()
                .setLabel('Contact')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/users/${interaction.user.id}`)
                .setEmoji('💬')
        );

        // Copy code button (using custom ID for later interaction)
        buttons.addComponents(
            new ButtonBuilder()
                .setLabel('Bookmark')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(`bookmark_${Date.now()}`)
                .setEmoji('🔖')
        );

        const components = buttons.components.length > 0 ? [buttons] : [];

        await channel.send({ embeds: [embed], components });

        await interaction.reply({
            embeds: [{
                color: config.settings.successColor,
                title: '✅ Code Shared Successfully!',
                description: `Your code has been posted in <#${CHANNELS.codes}>`,
                footer: {
                    text: config.settings.embedFooter,
                    icon_url: config.settings.embedFooterIcon
                }
            }],
            ephemeral: true
        });
    } catch (error) {
        console.error('❌ Error in code showcase:', error);
        await interaction.reply({
            embeds: [{
                color: config.settings.errorColor,
                description: '❌ Failed to share code. Please try again.'
            }],
            ephemeral: true
        });
    }
}

async function handleProjectShowcase(interaction, client) {
    const name = interaction.options.getString('name');
    const type = interaction.options.getString('type');
    const description = interaction.options.getString('description');
    const technologies = interaction.options.getString('technologies');
    const features = interaction.options.getString('features');
    const version = interaction.options.getString('version');
    const github = interaction.options.getString('github');
    const demo = interaction.options.getString('demo');
    const license = interaction.options.getString('license');

    try {
        const channel = await client.channels.fetch(CHANNELS.projects);

        const embed = new EmbedBuilder()
            .setColor('#00D9FF')
            .setAuthor({
                name: `${interaction.user.username} shared a project`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTitle(`${getProjectTypeEmoji(type)} ${name}`)
            .setDescription(`**${description}**`)
            .addFields(
                { name: '📂 Type', value: getProjectTypeName(type), inline: true },
                { name: '👤 Developer', value: `<@${interaction.user.id}>`, inline: true }
            );

        if (version) {
            embed.addFields({ name: '🏷️ Version', value: `\`${version}\``, inline: true });
        }

        embed.addFields({
            name: '🛠️ Technologies',
            value: technologies.split(',').map(t => `\`${t.trim()}\``).join(' • '),
            inline: false
        });

        if (features) {
            const featuresList = features.split(',').map(f => `• ${f.trim()}`).join('\n');
            embed.addFields({
                name: '✨ Key Features',
                value: featuresList.substring(0, 1024),
                inline: false
            });
        }

        if (license) {
            embed.addFields({ name: '📜 License', value: `\`${license}\``, inline: true });
        }

        embed.setFooter({
            text: `${config.settings.embedFooter} | Launched on`,
            icon_url: config.settings.embedFooterIcon
        });
        embed.setTimestamp();

        // Enhanced Buttons
        const buttons = new ActionRowBuilder();

        if (github) {
            buttons.addComponents(
                new ButtonBuilder()
                    .setLabel('Source Code')
                    .setStyle(ButtonStyle.Link)
                    .setURL(github)
                    .setEmoji('📦')
            );
        }

        if (demo) {
            buttons.addComponents(
                new ButtonBuilder()
                    .setLabel('Live Demo')
                    .setStyle(ButtonStyle.Link)
                    .setURL(demo)
                    .setEmoji('🌐')
            );
        }

        // Contact via Discord
        buttons.addComponents(
            new ButtonBuilder()
                .setLabel('Contact Dev')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/users/${interaction.user.id}`)
                .setEmoji('💬')
        );

        // Star/Bookmark button
        buttons.addComponents(
            new ButtonBuilder()
                .setLabel('Star')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(`star_${Date.now()}`)
                .setEmoji('⭐')
        );

        const components = buttons.components.length > 0 ? [buttons] : [];

        await channel.send({ embeds: [embed], components });

        await interaction.reply({
            embeds: [{
                color: config.settings.successColor,
                title: '✅ Project Shared Successfully!',
                description: `Your project has been showcased in <#${CHANNELS.projects}>`,
                footer: {
                    text: config.settings.embedFooter,
                    icon_url: config.settings.embedFooterIcon
                }
            }],
            ephemeral: true
        });
    } catch (error) {
        console.error('❌ Error in project showcase:', error);
        await interaction.reply({
            embeds: [{
                color: config.settings.errorColor,
                description: '❌ Failed to share project. Please try again.'
            }],
            ephemeral: true
        });
    }
}

function getLanguageEmoji(language) {
    const emojis = {
        javascript: '🟨',
        typescript: '🔷',
        nodejs: '🟢',
        python: '🐍',
        java: '☕',
        cpp: '⚙️',
        csharp: '💎',
        php: '🐘',
        ruby: '💎',
        go: '🔵',
        rust: '🦀',
        html: '🌐',
        sql: '🗄️'
    };
    return emojis[language] || '💻';
}

function getProjectTypeEmoji(type) {
    const emojis = {
        web: '🌐',
        mobile: '📱',
        game: '🎮',
        bot: '🤖',
        tool: '🛠️',
        library: '📚',
        design: '🎨',
        other: '💻'
    };
    return emojis[type] || '💻';
}

function getProjectTypeName(type) {
    const names = {
        web: 'Web Application',
        mobile: 'Mobile App',
        game: 'Game',
        bot: 'Bot/Automation',
        tool: 'Tool/Utility',
        library: 'Library/Framework',
        design: 'Design System',
        other: 'Other'
    };
    return names[type] || type;
}