// src/utils/permissions.js - Complete Working Version with Database

import { getConfig } from '../models/index.js';

// Permission levels
export const PermissionLevels = {
    EVERYONE: 0,
    MEMBER: 1,
    VIP: 2,
    HELPER: 3,
    MODERATOR: 4,
    ADMIN: 5,
    OWNER: 6
};

// Parse permission level from string or number
export function parsePermissionLevel(level) {
    if (typeof level === 'number') {
        return level;
    }
    
    if (typeof level === 'string') {
        const levelMap = {
            'everyone': PermissionLevels.EVERYONE,
            'member': PermissionLevels.MEMBER,
            'vip': PermissionLevels.VIP,
            'helper': PermissionLevels.HELPER,
            'moderator': PermissionLevels.MODERATOR,
            'mod': PermissionLevels.MODERATOR,
            'admin': PermissionLevels.ADMIN,
            'owner': PermissionLevels.OWNER
        };
        
        return levelMap[level.toLowerCase()] || PermissionLevels.EVERYONE;
    }
    
    return PermissionLevels.EVERYONE;
}

// Get user permission level from database
export async function getUserPermissionLevel(member) {
    try {
        const dbConfig = await getConfig();
        
        if (!dbConfig) {
            console.error('⚠️  No database config found!');
            return PermissionLevels.EVERYONE;
        }

        const userId = member.id || member.user?.id;
        
        // Debug log
        console.log(`\n🔍 [Permission Check] User: ${member.user?.tag || member.tag}`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Owners in DB:`, dbConfig.permissions?.owners);

        // Check if owner (HIGHEST PRIORITY)
        const owners = dbConfig.permissions?.owners || [];
        if (owners.includes(userId)) {
            console.log(`   ✅ USER IS OWNER!`);
            return PermissionLevels.OWNER;
        }

        // Check role-based permissions
        const roles = member.roles?.cache || member.roles;

        // Admin
        const adminRoles = dbConfig.permissions?.roles?.admin || [];
        const hasAdmin = adminRoles.some(roleId => roles.has(roleId));
        if (hasAdmin) {
            console.log(`   ✅ USER IS ADMIN!`);
            return PermissionLevels.ADMIN;
        }

        // Moderator
        const modRoles = dbConfig.permissions?.roles?.moderator || [];
        const hasMod = modRoles.some(roleId => roles.has(roleId));
        if (hasMod) {
            console.log(`   ✅ USER IS MODERATOR!`);
            return PermissionLevels.MODERATOR;
        }

        // Helper
        const helperRoles = dbConfig.permissions?.roles?.helper || [];
        const hasHelper = helperRoles.some(roleId => roles.has(roleId));
        if (hasHelper) {
            console.log(`   ✅ USER IS HELPER!`);
            return PermissionLevels.HELPER;
        }

        // VIP
        const vipRoles = dbConfig.permissions?.roles?.vip || [];
        const hasVIP = vipRoles.some(roleId => roles.has(roleId));
        if (hasVIP) {
            console.log(`   ✅ USER IS VIP!`);
            return PermissionLevels.VIP;
        }

        // Member (default)
        console.log(`   ℹ️  USER IS MEMBER (default)`);
        return PermissionLevels.MEMBER;

    } catch (error) {
        console.error('❌ Error getting user permission:', error);
        return PermissionLevels.EVERYONE;
    }
}

// Check if user has permission for command
export async function hasPermission(member, commandName, requiredLevel) {
    try {
        const userLevel = await getUserPermissionLevel(member);
        
        console.log(`\n🔐 [Permission Check] Command: ${commandName}`);
        console.log(`   User Level: ${userLevel} (${getPermissionLevelName(userLevel)})`);
        console.log(`   Required Level: ${requiredLevel} (${getPermissionLevelName(requiredLevel)})`);
        
        const hasAccess = userLevel >= requiredLevel;
        console.log(`   Result: ${hasAccess ? '✅ ACCESS GRANTED' : '❌ ACCESS DENIED'}\n`);
        
        return hasAccess;
    } catch (error) {
        console.error('❌ Permission check error:', error);
        return false;
    }
}

// Get command required level (with database override)
export async function getCommandRequiredLevel(commandName, defaultLevel, dbConfig = null) {
    try {
        if (!dbConfig) {
            dbConfig = await getConfig();
        }

        // Check if there's a command-specific override in database
        const commandOverride = dbConfig?.commandPermissions?.[commandName];
        if (commandOverride !== undefined) {
            return parsePermissionLevel(commandOverride);
        }
        
        return defaultLevel !== undefined ? defaultLevel : PermissionLevels.EVERYONE;
    } catch (error) {
        return defaultLevel || PermissionLevels.EVERYONE;
    }
}

// Get permission level name
export function getPermissionLevelName(level) {
    const names = {
        0: 'Everyone',
        1: 'Member',
        2: 'VIP',
        3: 'Helper',
        4: 'Moderator',
        5: 'Admin',
        6: 'Owner'
    };
    return names[level] || 'Unknown';
}

// Get error message for insufficient permissions
export function getPermissionErrorMessage(requiredLevel) {
    return {
        embeds: [{
            color: 0xED4245,
            title: '🔒 Access Denied',
            description: `You don't have permission to use this command.\n\n**Required Level:** ${getPermissionLevelName(requiredLevel)}\n\n**Need help?** Contact a server administrator.`,
            footer: { text: 'Crévion Community' }
        }],
        ephemeral: true
    };
}

// Check if user is owner (quick check)
export async function isOwner(userId) {
    try {
        const dbConfig = await getConfig();
        const owners = dbConfig?.permissions?.owners || [];
        return owners.includes(userId);
    } catch (error) {
        return false;
    }
}

// Check if user has role
export function hasRole(member, roleId) {
    return member.roles?.cache?.has(roleId) || member.roles?.has(roleId) || false;
}