class ServerStatus {
    constructor() {
        this.serverIP = 'infinitynp.fun';
        this.updateInterval = 3000; // 3 seconds
        this.initialize();
    }

    initialize() {
        this.updateServerStatus();
        setInterval(() => this.updateServerStatus(), this.updateInterval);
    }

    async updateServerStatus() {
        try {
            const response = await fetch(`https://api.mcsrvstat.us/2/${this.serverIP}`);
            const data = await response.json();
            
            const statusElement = document.getElementById('serverStatus');
            const playerCountElement = document.getElementById('playerCount');
            const playersGrid = document.getElementById('playersGrid');

            if (data.online) {
                statusElement.textContent = 'Online';
                statusElement.className = 'status-indicator online';
                playerCountElement.textContent = data.players?.online || 0;

                // Update players grid
                if (data.players?.list && playersGrid) {
                    playersGrid.innerHTML = '';
                    data.players.list.forEach(player => {
                        const playerCard = this.createPlayerCard(player);
                        playersGrid.appendChild(playerCard);
                    });
                } else if (playersGrid) {
                    playersGrid.innerHTML = '<div class="no-players">No players online</div>';
                }
            } else {
                statusElement.textContent = 'Offline';
                statusElement.className = 'status-indicator offline';
                playerCountElement.textContent = '0';
                if (playersGrid) {
                    playersGrid.innerHTML = '<div class="no-players">Server is offline</div>';
                }
            }
        } catch (error) {
            console.error('Error updating server status:', error);
            const statusElement = document.getElementById('serverStatus');
            if (statusElement) {
                statusElement.textContent = 'Error';
                statusElement.className = 'status-indicator error';
            }
        }
    }

    createPlayerCard(username) {
        const card = document.createElement('div');
        card.className = 'player-card animate__animated animate__fadeIn';
        card.innerHTML = `
            <div class="player-head">
                <img src="https://mc-heads.net/avatar/${username}" alt="${username}'s head" loading="lazy">
            </div>
            <div class="player-info">
                <span class="player-name">${username}</span>
            </div>
        `;
        return card;
    }
}

// Copy IP function
function copyIP() {
    const ip = 'infinitynp.fun:25000';
    navigator.clipboard.writeText(ip)
        .then(() => {
            const copyBtn = document.querySelector('.copy-btn');
            copyBtn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon>';
            setTimeout(() => {
                copyBtn.innerHTML = '<ion-icon name="copy-outline"></ion-icon>';
            }, 2000);
        })
        .catch(err => console.error('Failed to copy:', err));
}

// Initialize server status
window.addEventListener('DOMContentLoaded', () => {
    new ServerStatus();
});