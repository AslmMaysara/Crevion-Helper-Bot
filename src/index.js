import { Client, GatewayIntentBits, Events, Collection, ActivityType } from 'discord.js';
import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { config } from './config/config.js';
import { hasPermission, getPermissionErrorMessage, getCommandRequiredLevel } from './utils/permissions.js';
import { lineManager } from './utils/lineManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const BOT_CONFIG = {
    name: 'Crevion',
    description: 'Crevion Community Helper Bot ✔︎',
    version: '1.0.0',
    color: 0x370080,
    activities: [
        { name: '🌐 https://crevion.netlify.app', type: ActivityType.Watching },
        { name: '💬 discord.gg/mP9apCqDSZ', type: ActivityType.Playing },
        { name: '🎨 The World Of Creativity', type: ActivityType.Listening },
        { name: '✨ Crevion Community', type: ActivityType.Competing },
    ],
    statusRotationInterval: 15000,
    presence: {
        status: 'dnd',
        afk: false
    }
};

client.commands = new Collection();
client.prefixCommands = new Collection();
client.config = BOT_CONFIG;

client.lineUrl = lineManager.getUrl();

client.stats = {
    commandsExecuted: 0,
    errors: 0,
    startTime: Date.now()
};

async function loadCommands() {
    const commandsPath = join(__dirname, 'commands');
    if (!existsSync(commandsPath)) {
        console.warn('⚠️ No commands folder found.');
        return;
    }

    let loadedCount = 0;
    const folders = readdirSync(commandsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    for (const folder of folders) {
        const folderPath = join(commandsPath, folder);
        const files = readdirSync(folderPath).filter(f => f.endsWith('.js'));

        for (const file of files) {
            try {
                const fileUrl = pathToFileURL(join(folderPath, file)).href;
                const { default: command } = await import(fileUrl);
                
                if (command?.data && command?.execute) {
                    client.commands.set(command.data.name, command);
                    
                    if (command.prefixAlias) {
                        client.prefixCommands.set(command.prefixAlias, command);
                    }
                    
                    loadedCount++;
                    console.log(`✅ Loaded command: ${command.data.name} (${folder})${command.permission ? ` [${command.permission}]` : ''}`);
                } else {
                    console.warn(`⚠️ Skipped ${file}: missing data or execute`);
                }
            } catch (error) {
                console.error(`❌ Error loading ${file}:`, error.message);
            }
        }
    }

    console.log(`\n📦 Total commands loaded: ${loadedCount}\n`);
}

async function loadEvents() {
    const eventsPath = join(__dirname, 'events');
    if (!existsSync(eventsPath)) {
        console.warn('⚠️ No events folder found.');
        return;
    }

    let loadedCount = 0;
    const files = readdirSync(eventsPath).filter(f => f.endsWith('.js'));

    for (const file of files) {
        try {
            const fileUrl = pathToFileURL(join(eventsPath, file)).href;
            const { default: event } = await import(fileUrl);

            if (event?.name && typeof event.execute === 'function') {
                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                }
                loadedCount++;
                console.log(`🎯 Loaded event: ${event.name}${event.once ? ' (once)' : ''}`);
            } else {
                console.warn(`⚠️ Invalid event file: ${file}`);
            }
        } catch (error) {
            console.error(`❌ Error loading ${file}:`, error.message);
        }
    }

    console.log(`\n🎯 Total events loaded: ${loadedCount}\n`);
}

function setCustomStatus() {
    let currentIndex = 0;

    const updateStatus = () => {
        const activity = BOT_CONFIG.activities[currentIndex];
        client.user.setPresence({
            activities: [activity],
            status: BOT_CONFIG.presence.status,
            afk: BOT_CONFIG.presence.afk
        });

        currentIndex = (currentIndex + 1) % BOT_CONFIG.activities.length;
    };

    updateStatus();
    setInterval(updateStatus, BOT_CONFIG.statusRotationInterval);
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;

    try {
        if (cmd.permission !== undefined) {
            const member = await interaction.guild.members.fetch(interaction.user.id);
            
            if (!hasPermission(member, interaction.commandName, cmd.permission)) {
                const requiredLevel = getCommandRequiredLevel(interaction.commandName, cmd.permission);
                return await interaction.reply(getPermissionErrorMessage(requiredLevel));
            }
        }

        await cmd.execute(interaction, client);
        client.stats.commandsExecuted++;
        
        if (config.features.commandLogging) {
            console.log(`📝 ${interaction.user.tag} used /${interaction.commandName}`);
        }
    } catch (err) {
        console.error(`❌ Error in command ${interaction.commandName}:`, err);
        client.stats.errors++;
        
        const errorMessage = {
            embeds: [{
                color: config.settings.errorColor,
                title: '❌ حدث خطأ',
                description: 'حدث خطأ أثناء تنفيذ الأمر. يرجى المحاولة مرة أخرى.',
                footer: {
                    text: config.settings.embedFooter,
                    icon_url: config.settings.embedFooterIcon
                }
            }],
            ephemeral: true
        };

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply(errorMessage).catch(console.error);
        } else if (interaction.deferred) {
            await interaction.editReply(errorMessage).catch(console.error);
        }
    }
});

client.once(Events.ClientReady, async readyClient => {
    console.log('\n' + '='.repeat(50));
    console.log(`🤖 ${BOT_CONFIG.name} v${BOT_CONFIG.version} is ready!`);
    console.log(`📊 Logged in as: ${readyClient.user.tag}`);
    console.log(`🌐 Serving ${readyClient.guilds.cache.size} servers`);
    console.log(`👥 Watching ${readyClient.users.cache.size} users`);
    console.log(`⚡ Slash Commands: ${client.commands.size}`);
    console.log(`💬 Prefix Commands: ${client.prefixCommands.size}`);
    console.log('='.repeat(50) + '\n');

    setCustomStatus();
});

process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await client.destroy();
    process.exit(0);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    if (error.message?.includes('FATAL')) {
        process.exit(1);
    }
});

async function start() {
    console.log('\n🚀 Starting Crevion Bot...\n');
    await loadCommands();
    await loadEvents();
    console.log('🔐 Logging in to Discord...\n');
    await client.login(config.token);
}

start();