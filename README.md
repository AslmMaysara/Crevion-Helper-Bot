# 🎨 Crevion Bot - Ultimate Creative Community Bot

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

An advanced Discord bot designed specifically for creative communities, featuring AI-powered tools, project showcasing, and comprehensive management systems.

---

## ✨ Features

### 🤖 AI-Powered Tools
- **AI Assistant** - Advanced Claude-powered assistant specializing in programming, design, and video editing
- **Color Palette Extractor** - Extract dominant colors from any image with AI precision
- **Background Remover** - Remove backgrounds from images using AI

### 💼 Creator Tools
- **Project Showcase** - Share projects with detailed information and live demos
- **Code Showcase** - Share code snippets with syntax highlighting
- **Line Manager** - Custom line/separator image system with role-based permissions

### 🛠️ Management
- **Dynamic Permissions** - Role and user-based permission system
- **Auto Reply** - Create custom auto-responses with triggers
- **Auto Line** - Automatically send separators in specific channels
- **Say Command** - Make the bot send messages and embeds

### 📊 Utility
- **Help System** - Interactive help menu with category selection
- **Stats & Info** - Detailed bot and server statistics
- **Ping** - Check bot latency and uptime

---

## 🚀 Installation

### Prerequisites
- Node.js 18.0.0 or higher
- Discord Bot Token
- (Optional) Remove.bg API key for background removal

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-repo/crevion-bot.git
cd crevion-bot
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the root directory:
```env
DISCORD_TOKEN=your_discord_token_here
CLIENT_ID=your_bot_client_id_here
REMOVE_BG_API_KEY=your_removebg_api_key_here
```

4. **Configure the bot**
Edit `src/config/config.js`:
- Set your server IDs
- Configure owner user IDs
- Customize colors and branding

5. **Deploy commands**
```bash
npm run deploy
```

6. **Start the bot**
```bash
npm start
```

---

## 📋 Command List

### General Commands
- `/help [command]` - Display help menu
- `/ping` - Check bot latency
- `/info` - Bot information
- `/stats` - Detailed statistics (Helper+)

### Creator Commands
- `/showcase code` - Share a code snippet
  - `name` - Code name
  - `language` - Programming language
  - `description` - What it does
  - `code` - The code itself
  - `usage` - How to use it
  - `version` - Version number
  - `github` - Repository URL

- `/showcase project` - Share a project
  - `name` - Project name
  - `type` - Project type
  - `description` - Project description
  - `technologies` - Tech stack
  - `features` - Key features
  - `version` - Current version
  - `github` - Repository URL
  - `demo` - Live demo URL
  - `license` - License type

### Line System (Owner)
- `/line set <url>` - Set line image
- `/line roles add <role>` - Add role permission
- `/line roles remove <role>` - Remove role permission
- `/line roles list` - List allowed roles
- `/line info` - View configuration

**Manual Triggers:** Type `خط` or `line` (requires configured role)

### Auto Reply (Admin)
- `/autoreply add` - Add auto reply
  - `trigger` - Trigger text
  - `response` - Bot response
  - `mention` - Mention user in reply
  - `reply` - Reply to message
  - `exact` - Exact match only

- `/autoreply remove <trigger>` - Remove auto reply
- `/autoreply list` - List all auto replies
- `/autoreply clear` - Clear all auto replies

### Auto Line (Admin)
- `/autoline add <channel>` - Enable in channel
- `/autoline remove <channel>` - Disable in channel
- `/autoline list` - List enabled channels

### Say Command (Admin)
- `/say message <text> [channel]` - Send text message
- `/say embed` - Send embed message
  - `title` - Embed title
  - `description` - Embed description
  - `color` - Hex color code
  - `image` - Image URL
  - `thumbnail` - Thumbnail URL
  - `channel` - Target channel

- `/say reply <message_id> <text> [channel]` - Reply to message

### Permissions (Owner)
- `/permissions user <user> <level>` - Set user permission
- `/permissions role <role> <level>` - Set role permission
- `/permissions command <command> <level>` - Set command permission
- `/permissions remove <type> <id>` - Remove permission
- `/permissions list` - List all permissions
- `/permissions check <user>` - Check user permissions

---

## 🎨 AI Features Setup

### Color Palette Extractor
1. Automatically works in designated channel (ID: `1437116837228843168`)
2. Upload any image
3. Bot extracts dominant colors with names and percentages

### Background Remover
1. Get free API key from [remove.bg](https://www.remove.bg/api)
2. Add to `.env`: `REMOVE_BG_API_KEY=your_key`
3. Upload images in designated channel (ID: `1437119020754276452`)
4. Bot removes background automatically

### AI Assistant
1. Works in designated channel (ID: `1437119111221084261`)
2. Mention bot or reply to its messages
3. Specializes in:
   - Programming & debugging
   - Design & UI/UX
   - Video editing techniques
   - Image generation
   - General assistance

---

## 🔐 Permission Levels

The bot uses a 7-level permission system:

| Level | Name | Value | Description |
|-------|------|-------|-------------|
| 0 | Everyone | `EVERYONE` | All members |
| 1 | Member | `MEMBER` | Regular members |
| 2 | VIP | `VIP` | VIP members |
| 3 | Helper | `HELPER` | Community helpers |
| 4 | Moderator | `MODERATOR` | Moderators |
| 5 | Admin | `ADMIN` | Administrators |
| 6 | Owner | `OWNER` | Bot owners |

### Setting Permissions

**In Code:**
```javascript
export default {
    data: SlashCommandBuilder()...,
    permission: PermissionLevels.ADMIN,
    async execute(interaction, client) { ... }
}
```

**Dynamically:**
```bash
/permissions user @user moderator
/permissions role @Role admin
/permissions command ping vip
```

---

## 📁 Project Structure

```
crevion-bot/
├── data/                        # JSON databases
│   ├── permissions.json
│   ├── autoreplies.json
│   ├── autolines.json
│   └── line-config.json
├── scripts/
│   └── deploy-commands.js
├── src/
│   ├── commands/
│   │   ├── creator/
│   │   │   └── showcase.js
│   │   ├── general/
│   │   │   ├── help.js
│   │   │   ├── info.js
│   │   │   ├── line.js
│   │   │   ├── ping.js
│   │   │   └── stats.js
│   │   ├── moderation/
│   │   │   ├── autoline.js
│   │   │   ├── autoreply.js
│   │   │   └── say.js
│   │   └── owner/
│   │       └── permissions.js
│   ├── config/
│   │   └── config.js
│   ├── events/
│   │   ├── aiAssistant.js
│   │   ├── backgroundRemover.js
│   │   ├── colorExtractor.js
│   │   ├── interactionCreate.js
│   │   ├── messageCreate.js
│   │   └── index.js
│   ├── utils/
│   │   ├── autoline.js
│   │   ├── autoreply.js
│   │   ├── database.js
│   │   ├── lineManager.js
│   │   └── permissions.js
│   └── index.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## 🛠️ Configuration

### Channel IDs
Update these in the respective command files:

```javascript
// Color extractor channel
const COLOR_CHANNEL_ID = '1437116837228843168';

// Background remover channel
const BG_REMOVE_CHANNEL_ID = '1437119020754276452';

// AI assistant channel
const AI_CHANNEL_ID = '1437119111221084261';

// Showcase channels
const CHANNELS = {
    codes: '1424814715439288454',
    projects: '1435190203798126602'
};
```

### Bot Configuration
Edit `src/config/config.js`:

```javascript
export const config = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    
    permissions: {
        owners: ['YOUR_USER_ID'],
        roles: {
            admin: ['ADMIN_ROLE_ID'],
            moderator: ['MOD_ROLE_ID'],
            // ... etc
        }
    },
    
    settings: {
        prefix: '$',
        defaultColor: 0x370080,
        // ... etc
    }
};
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📝 License

This project is licensed under the MIT License.

---

## 💬 Support

Join our Discord: [discord.gg/mP9apCqDSZ](https://discord.gg/mP9apCqDSZ)

Website: [crevion.netlify.app](https://crevion.netlify.app)

---

## 🎉 Credits

Developed by the Crevion Development Team

Powered by:
- Discord.js
- Claude AI (Anthropic)
- Remove.bg API

---

Made with ❤️ by the Crevion Community