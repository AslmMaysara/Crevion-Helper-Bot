import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { config } from '../src/config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];
const commandsPath = join(__dirname, '..', 'src', 'commands');

console.log('🚀 Starting command deployment...\n');

for (const folder of readdirSync(commandsPath)) {
    const folderPath = join(commandsPath, folder);
    const files = readdirSync(folderPath).filter(f => f.endsWith('.js'));

    for (const file of files) {
        try {
            const fileUrl = pathToFileURL(join(folderPath, file)).href;
            const { default: command } = await import(fileUrl);

            if (command?.data && command?.execute) {
                commands.push(command.data.toJSON());
                console.log(`✅ Loaded: ${command.data.name} (${folder})`);
            } else {
                console.warn(`⚠️  Skipped: ${file} - missing data or execute`);
            }
        } catch (error) {
            console.error(`❌ Error loading ${file}:`, error.message);
        }
    }
}

console.log(`\n📦 Total commands to deploy: ${commands.length}\n`);

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log('🔄 Started refreshing application (/) commands...\n');

        const data = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );

        console.log(`✅ Successfully deployed ${data.length} application (/) commands!`);
        console.log('\n' + '='.repeat(50));
        console.log('🎉 Deployment completed successfully!');
        console.log('='.repeat(50) + '\n');

    } catch (error) {
        console.error('\n❌ Error during deployment:', error);
        process.exit(1);
    }
})();