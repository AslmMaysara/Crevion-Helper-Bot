// src/utils/challengeScheduler.js - Daily Challenge Posting System

import { Challenge, getConfig } from '../models/index.js';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// Challenge templates pool
const CHALLENGE_TEMPLATES = [
    {
        difficulty: 'easy',
        topics: ['Arrays', 'Strings'],
        title: 'Two Sum',
        problem: {
            statement: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.',
            examples: [
                {
                    input: 'nums = [2,7,11,15], target = 9',
                    output: '[0,1]',
                    explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
                }
            ],
            constraints: [
                '2 <= nums.length <= 10^4',
                '-10^9 <= nums[i] <= 10^9',
                'Only one valid answer exists'
            ],
            hints: ['Use a hash map for O(n) solution', 'Think about what you need to find']
        },
        links: {
            leetcode: 'https://leetcode.com/problems/two-sum/',
            other: null
        }
    },
    {
        difficulty: 'medium',
        topics: ['Arrays', 'Hash Table', 'Sliding Window'],
        title: 'Longest Substring Without Repeating Characters',
        problem: {
            statement: 'Given a string `s`, find the length of the longest substring without repeating characters.',
            examples: [
                {
                    input: 's = "abcabcbb"',
                    output: '3',
                    explanation: 'The answer is "abc", with the length of 3.'
                },
                {
                    input: 's = "bbbbb"',
                    output: '1',
                    explanation: 'The answer is "b", with the length of 1.'
                }
            ],
            constraints: [
                '0 <= s.length <= 5 * 10^4',
                's consists of English letters, digits, symbols and spaces.'
            ],
            hints: ['Use sliding window technique', 'Track characters with a Set or Map']
        },
        links: {
            leetcode: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
            other: null
        }
    },
    {
        difficulty: 'difficult',
        topics: ['Arrays', 'Binary Search', 'Divide and Conquer'],
        title: 'Median of Two Sorted Arrays',
        problem: {
            statement: 'Given two sorted arrays `nums1` and `nums2` of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).',
            examples: [
                {
                    input: 'nums1 = [1,3], nums2 = [2]',
                    output: '2.00000',
                    explanation: 'merged array = [1,2,3] and median is 2.'
                }
            ],
            constraints: [
                'nums1.length == m',
                'nums2.length == n',
                '0 <= m <= 1000',
                '0 <= n <= 1000',
                '-10^6 <= nums1[i], nums2[i] <= 10^6'
            ],
            hints: ['Use binary search on the smaller array', 'Think about partitioning']
        },
        links: {
            leetcode: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
            other: null
        }
    }
];

export class ChallengeScheduler {
    constructor(client) {
        this.client = client;
        this.schedulerInterval = null;
    }

    // Start the scheduler
    async start() {
        console.log('🧩 Starting Daily Challenge Scheduler...');
        
        // Check immediately on startup
        await this.checkAndPost();
        
        // Then check every hour
        this.schedulerInterval = setInterval(async () => {
            await this.checkAndPost();
        }, 60 * 60 * 1000); // Check every hour
        
        console.log('✅ Challenge Scheduler started (checks every hour)');
    }

    // Stop the scheduler
    stop() {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            console.log('🛑 Challenge Scheduler stopped');
        }
    }

    // Check if it's time to post and post challenge
    async checkAndPost() {
        try {
            const now = new Date();
            const cairoTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
            const hour = cairoTime.getHours();
            const minute = cairoTime.getMinutes();

            // Post at 12:00 PM Cairo time (with 5-minute window)
            if (hour === 12 && minute < 5) {
                // Check if we already posted today
                const today = new Date(cairoTime);
                today.setHours(0, 0, 0, 0);
                
                const existingChallenge = await Challenge.findOne({
                    scheduledFor: { $gte: today },
                    status: 'posted'
                });

                if (existingChallenge) {
                    console.log('✅ Challenge already posted today');
                    return;
                }

                // Post new challenge
                await this.postDailyChallenge();
            }
        } catch (error) {
            console.error('❌ Error in challenge scheduler:', error);
        }
    }

    // Post a new daily challenge
    async postDailyChallenge() {
        try {
            const dbConfig = await getConfig();
            const forumChannelId = dbConfig?.channels?.problemSolving || '1447987005387575460';
            
            const channel = await this.client.channels.fetch(forumChannelId);
            
            if (!channel || !channel.isThreadOnly()) {
                console.error('❌ Forum channel not found or invalid');
                return;
            }

            // Select random challenge template
            const template = CHALLENGE_TEMPLATES[Math.floor(Math.random() * CHALLENGE_TEMPLATES.length)];
            
            // Create challenge embed
            const embed = this.createChallengeEmbed(template);
            
            // Get tags from forum channel
            const availableTags = channel.availableTags;
            const selectedTags = [];
            
            // Add difficulty tag
            const difficultyTag = availableTags.find(t => 
                t.name.toLowerCase() === template.difficulty.toLowerCase()
            );
            if (difficultyTag) {
                selectedTags.push(difficultyTag.id);
            }
            
            // Add topic tags (maximum 2 more tags)
            for (const topic of template.topics.slice(0, 2)) {
                const topicTag = availableTags.find(t => 
                    t.name.toLowerCase() === topic.toLowerCase() ||
                    t.name.toLowerCase().includes(topic.toLowerCase())
                );
                if (topicTag && !selectedTags.includes(topicTag.id)) {
                    selectedTags.push(topicTag.id);
                }
            }
            
            // If no topic tags found, try to add language/category tags
            if (selectedTags.length < 3) {
                // Try to find JavaScript, Python, etc tags
                const langTags = ['javascript', 'python', 'java', 'c++', 'algorithms', 'data structures'];
                for (const lang of langTags) {
                    if (selectedTags.length >= 5) break; // Discord max is 5 tags
                    const langTag = availableTags.find(t => 
                        t.name.toLowerCase().includes(lang)
                    );
                    if (langTag && !selectedTags.includes(langTag.id)) {
                        selectedTags.push(langTag.id);
                    }
                }
            }

            console.log(`📌 Selected ${selectedTags.length} tags for challenge`);

            // Create forum post (thread) with tags
            const thread = await channel.threads.create({
                name: `🧩 ${template.title}`,
                message: {
                    embeds: [embed],
                    components: this.createChallengeButtons(template)
                },
                appliedTags: selectedTags.slice(0, 5), // Max 5 tags
                autoArchiveDuration: 1440 // 24 hours
            });

            console.log(`✅ Posted daily challenge: ${template.title} with ${selectedTags.length} tags`);

            // Save to database
            const challenge = new Challenge({
                title: template.title,
                description: template.problem.statement,
                difficulty: template.difficulty,
                problem: template.problem,
                links: template.links,
                topics: template.topics,
                postId: thread.id,
                channelId: forumChannelId,
                tagIds: selectedTags,
                scheduledFor: new Date(),
                postedAt: new Date(),
                status: 'posted'
            });

            await challenge.save();
            console.log('✅ Challenge saved to database');

        } catch (error) {
            console.error('❌ Error posting daily challenge:', error);
            console.error('   Error details:', error.message);
            console.error('   Stack:', error.stack);
        }
    }

    // Create challenge embed
    createChallengeEmbed(template) {
        const difficultyColors = {
            easy: 0x57F287,
            medium: 0xFEE75C,
            difficult: 0xED4245
        };

        const difficultyEmojis = {
            easy: '🟢',
            medium: '🟡',
            difficult: '🔴'
        };

        const embed = new EmbedBuilder()
            .setColor(difficultyColors[template.difficulty])
            .setTitle(`${difficultyEmojis[template.difficulty]} ${template.title}`)
            .setDescription(`**Difficulty:** ${template.difficulty.toUpperCase()}\n**Topics:** ${template.topics.join(', ')}\n\n**Problem Statement:**\n${template.problem.statement}`)
            .setTimestamp();

        // Add examples
        if (template.problem.examples && template.problem.examples.length > 0) {
            const examplesText = template.problem.examples.map((ex, i) => 
                `**Example ${i + 1}:**\n\`\`\`\nInput: ${ex.input}\nOutput: ${ex.output}\n\`\`\`\n*${ex.explanation}*`
            ).join('\n\n');
            
            embed.addFields({ name: '💡 Examples', value: examplesText, inline: false });
        }

        // Add constraints
        if (template.problem.constraints && template.problem.constraints.length > 0) {
            embed.addFields({ 
                name: '⚙️ Constraints', 
                value: template.problem.constraints.map(c => `• ${c}`).join('\n'), 
                inline: false 
            });
        }

        // Add hints
        if (template.problem.hints && template.problem.hints.length > 0) {
            embed.addFields({ 
                name: '💭 Hints', 
                value: template.problem.hints.map((h, i) => `${i + 1}. ${h}`).join('\n'), 
                inline: false 
            });
        }

        embed.setFooter({ 
            text: '🏆 Solve this challenge and showcase your skills!' 
        });

        return embed;
    }

    // Create challenge buttons with external links
    createChallengeButtons(template) {
        const buttons = [];

        if (template.links.leetcode) {
            buttons.push(
                new ButtonBuilder()
                    .setLabel('Solve on LeetCode')
                    .setStyle(ButtonStyle.Link)
                    .setURL(template.links.leetcode)
                    .setEmoji('🔗')
            );
        }

        if (template.links.codeforces) {
            buttons.push(
                new ButtonBuilder()
                    .setLabel('Solve on CodeForces')
                    .setStyle(ButtonStyle.Link)
                    .setURL(template.links.codeforces)
                    .setEmoji('🔗')
            );
        }

        if (template.links.hackerrank) {
            buttons.push(
                new ButtonBuilder()
                    .setLabel('Solve on HackerRank')
                    .setStyle(ButtonStyle.Link)
                    .setURL(template.links.hackerrank)
                    .setEmoji('🔗')
            );
        }

        return buttons.length > 0 ? [new ActionRowBuilder().addComponents(...buttons)] : [];
    }
}

// Export singleton instance
let schedulerInstance = null;

export function initChallengeScheduler(client) {
    if (!schedulerInstance) {
        schedulerInstance = new ChallengeScheduler(client);
        schedulerInstance.start();
    }
    return schedulerInstance;
}

export function getChallengeScheduler() {
    return schedulerInstance;
}