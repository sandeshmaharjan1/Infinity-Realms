// Discord Widget Configuration
const DISCORD_INVITE_CODE = 'qNDSCNyMKx';
const UPDATE_INTERVAL = 5000; // Update interval in milliseconds

async function updateDiscordCount() {
    try {
        const response = await fetch(`https://discord.com/api/v10/invites/${DISCORD_INVITE_CODE}?with_counts=true`, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        const onlineCount = data.approximate_presence_count;

        // Update the discord count element
        const countElement = document.getElementById('discord-count');
        if (countElement) {
            countElement.textContent = `${onlineCount} Online`;
        }
    } catch (error) {
        console.error('Error fetching Discord data:', error);
        const countElement = document.getElementById('discord-count');
        if (countElement) {
            countElement.textContent = 'Join Discord';
        }
    }
}

// Initial update
updateDiscordCount();

// Set up periodic updates
setInterval(updateDiscordCount, UPDATE_INTERVAL);