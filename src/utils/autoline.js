// src/utils/autoline.js

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', '..', 'data');
const DB_PATH = join(DATA_DIR, 'autolines.json');

const COOLDOWN_MS = 8000; // 8 ثواني (غيرها براحتك)

class AutoLineSystem {
    constructor() {
        this.channels = this.load();
        this.cooldowns = new Map(); // runtime only
    }

    load() {
        try {
            if (!existsSync(DATA_DIR)) {
                mkdirSync(DATA_DIR, { recursive: true });
            }

            if (existsSync(DB_PATH)) {
                const raw = readFileSync(DB_PATH, 'utf-8');
                return JSON.parse(raw);
            }
        } catch (error) {
            console.error('❌ Error loading auto line channels:', error);
        }
        return {};
    }

    save() {
        try {
            writeFileSync(DB_PATH, JSON.stringify(this.channels, null, 2), 'utf-8');
            return true;
        } catch (error) {
            console.error('❌ Error saving auto line channels:', error);
            return false;
        }
    }

    // ────────────── BASIC CRUD ──────────────

    add(channelId, guildId) {
        this.channels[channelId] = {
            guildId,
            addedAt: Date.now(),
            messageCount: 0
        };
        return this.save();
    }

    remove(channelId) {
        if (!this.channels[channelId]) return false;
        delete this.channels[channelId];
        this.cooldowns.delete(channelId);
        return this.save();
    }

    isEnabled(channelId) {
        return !!this.channels[channelId];
    }

    getAll() {
        return this.channels;
    }

    getByGuild(guildId) {
        return Object.entries(this.channels)
            .filter(([_, data]) => data.guildId === guildId)
            .map(([channelId, data]) => ({ channelId, ...data }));
    }

    clear() {
        this.channels = {};
        this.cooldowns.clear();
        return this.save();
    }

    count() {
        return Object.keys(this.channels).length;
    }

    // ────────────── MESSAGE STATS ──────────────

    incrementCount(channelId) {
        if (!this.channels[channelId]) return;
        this.channels[channelId].messageCount++;
        this.save();
    }

    // ────────────── COOLDOWN LOGIC ──────────────

    canSend(channelId) {
        const last = this.cooldowns.get(channelId) || 0;
        return Date.now() - last >= COOLDOWN_MS;
    }

    markSent(channelId) {
        this.cooldowns.set(channelId, Date.now());
    }
}

export const autoLine = new AutoLineSystem();
