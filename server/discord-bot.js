// Discord bot for announcements only (chat functionality removed)
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let adminChannel;

module.exports = () => {
  client.once('ready', () => {
    console.log(`Discord bot logged in as ${client.user.tag}`);

    // Get the admin channel if configured
    if (process.env.DISCORD_SERVER_ID && process.env.DISCORD_ADMIN_CHANNEL_ID) {
      const guild = client.guilds.cache.get(process.env.DISCORD_SERVER_ID);
      if (guild) {
        adminChannel = guild.channels.cache.get(process.env.DISCORD_ADMIN_CHANNEL_ID);
        if (adminChannel) {
          console.log(`Connected to admin channel: ${adminChannel.name}`);
        } else {
          console.error('Admin channel not found!');
        }
      } else {
        console.error('Guild not found!');
      }
    }
  });

  // Basic message handling (can be used for announcements)
  client.on('messageCreate', async (message) => {
    // Basic message handling left for future use
  });

  // Login to Discord if token is available
  if (process.env.DISCORD_BOT_TOKEN) {
    client.login(process.env.DISCORD_BOT_TOKEN);
  }
};

// Export client for potential external use
module.exports.client = client;
