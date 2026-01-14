

// Shop Configuration
const CONFIG = {
    MINECRAFT_SERVER: 'infinitynp.fun',
    DISCORD_INVITE: 'qNDSCNyMKx',
    UPDATE_INTERVAL: 5000, // 5 seconds
    CURRENCY_API: 'https://api.exchangerate-api.com/v4/latest/NPR',
    FEATURED_ITEMS: ['legend', 'infinity-key', 'coins-5000'], // IDs of featured items
    NEW_ITEMS: ['elite', 'epic-key'], // Items to mark as "New"
    SALE_ITEMS: ['coins', 'key'], // Items to mark as "On Sale"
    POPULAR_ITEMS: ['legend', 'infinity-key', 'coins-5000'] // Popular items
};

// Basic UI interactions for the shop page (login modal, cart toggle, responsive tweaks)
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const shopContainer = document.querySelector('.shop-container');
    const cartCountEl = document.getElementById('cartCount');

    // Simple cart stored in localStorage
    let cart = [];
    function saveCart() { localStorage.setItem('shopCart', JSON.stringify(cart)); }
    function updateCartCount() {
        if (cartCountEl) cartCountEl.textContent = String(cart.length);
    }
    updateCartCount();

    // Toggle cart sidebar with overlay
    document.addEventListener('click', (e) => {
        if (e.target.closest('#cartBtn')) {
            e.preventDefault();
            const cartSidebar = document.getElementById('cartSidebar');
            
            // Create overlay if it doesn't exist
            let overlay = document.querySelector('.cart-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'cart-overlay';
                overlay.addEventListener('click', () => {
                    cartSidebar?.classList.remove('active');
                    overlay.classList.remove('active');
                });
                document.body.appendChild(overlay);
            }
            
            if (cartSidebar) {
                const isActive = cartSidebar.classList.toggle('active');
                overlay.classList.toggle('active', isActive);
            }
        }
    });

    // Login modal open/close
    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.add('active');
        });
    }

    // Close modal buttons (delegation)
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.matches('.close-modal') || target.closest('.close-modal')) {
            const modal = target.closest('.modal');
            if (modal) modal.classList.remove('active');
        }
    });

    // Escape key closes modals & cart
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
            const overlay = document.querySelector('.cart-overlay');
            if (cartSidebar) cartSidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        }
    });

    // Enhanced login system - No API validation required
    let currentUsername = '';
    let currentEmail = '';

    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Update active tab button
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            if (targetTab === 'register') {
                document.getElementById('registrationStep1').classList.add('active');
            } else {
                document.getElementById('loginStep').classList.add('active');
            }
            
            // Clear status messages
            showStatusMessage('', '');
        });
    });

     // Registration form handler - With API integration
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('minecraftUsername');
            const emailInput = document.getElementById('emailAddress');

            const username = usernameInput?.value?.trim();
            const email = emailInput?.value?.trim();

            if (!username) {
                showStatusMessage('Please enter a username', 'error');
                return;
            }

            if (!email) {
                showStatusMessage('Please enter an email address', 'error');
                return;
            }

            // Show loading state
            const submitBtn = registrationForm.querySelector('.submit-btn');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email })
                });

                const data = await response.json();

                if (response.ok && data.token) {
                    // Store user data and token locally after successful registration
                    const userData = {
                        username: username,
                        email: email,
                        token: data.token,
                        registeredAt: new Date().toISOString()
                    };

                    localStorage.setItem('shopUser', JSON.stringify(userData));

                    // Show success popup message
                    showPopupMessage('Registration successful! You are now logged in.', 'success');

                    // Update UI and close modal after delay
                    setTimeout(() => {
                        loginModal.classList.remove('active');
                        submitBtn.classList.remove('loading');
                        submitBtn.disabled = false;
                        registrationForm.reset();

                        // Update UI to show logged in state
                        updateUserUI(username);
                    }, 2000);
                } else {
                    showStatusMessage(data.error || 'Registration failed', 'error');
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Registration error:', error);
                showStatusMessage('Network error. Please try again.', 'error');
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }

    // Login form handler - With API integration and alternative login method
    const existingLoginForm = document.getElementById('loginForm');
    if (existingLoginForm) {
        existingLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('loginUsername');
            const emailInput = document.getElementById('loginEmail');

            const username = usernameInput?.value?.trim();
            const email = emailInput?.value?.trim();

            // Clear any previous status messages
            showStatusMessage('', '');

            if (!username) {
                showStatusMessage('Please enter your username', 'error');
                usernameInput?.focus();
                return;
            }

            if (!email) {
                showStatusMessage('Please enter your email address', 'error');
                emailInput?.focus();
                return;
            }

            // Show loading state
            const submitBtn = existingLoginForm.querySelector('.submit-btn');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            try {
                // First try with stored token (for registered users)
                const storedUser = localStorage.getItem('shopUser');
                let token = '';
                if (storedUser) {
                    try {
                        const userData = JSON.parse(storedUser);
                        token = userData.token || '';
                    } catch (e) {
                        console.error('Error parsing stored user data:', e);
                    }
                }

                let response, data;

                if (token) {
                    // Try login with token first
                    response = await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, email, token })
                    });
                    data = await response.json();

                    if (response.ok) {
                        // Update stored user data with login timestamp
                        const userData = {
                            username: username,
                            email: email,
                            token: token,
                            loginAt: new Date().toISOString(),
                            alternativeLogin: false
                        };

                        localStorage.setItem('shopUser', JSON.stringify(userData));

                        // Show success popup message
                        showPopupMessage('You are successfully logged in!', 'success');

                        // Update UI
                        updateUserUI(username);

                        // Close modal after delay
                        setTimeout(() => {
                            loginModal.classList.remove('active');
                            submitBtn.classList.remove('loading');
                            submitBtn.disabled = false;
                            existingLoginForm.reset();
                        }, 2000);
                        return;
                    }
                }

                // If token login failed or no token, try alternative login method
                // This could be a simplified login without token for existing users
                response = await fetch('/api/login-alternative', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email })
                });
                data = await response.json();

                if (response.ok) {
                    // For alternative login, create a session-based login
                    const userData = {
                        username: username,
                        email: email,
                        loginAt: new Date().toISOString(),
                        alternativeLogin: true,
                        token: null
                    };

                    localStorage.setItem('shopUser', JSON.stringify(userData));

                    // Show success popup message
                    showPopupMessage('You are successfully logged in!', 'success');

                    // Update UI
                    updateUserUI(username);

                    // Close modal after delay
                    setTimeout(() => {
                        loginModal.classList.remove('active');
                        submitBtn.classList.remove('loading');
                        submitBtn.disabled = false;
                        existingLoginForm.reset();
                    }, 2000);
                } else {
                    // Clear any previous error messages before showing new one
                    showStatusMessage('', '');
                    showStatusMessage(data.error || 'Login failed. Please register first.', 'error');
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Login error:', error);
                // Clear any previous error messages before showing network error
                showStatusMessage('', '');
                showStatusMessage('Network error. Please try again.', 'error');
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }

    // Helper function to show status messages
    function showStatusMessage(message, type) {
        const statusEl = document.getElementById('statusMessage');
        if (!statusEl) return;

        statusEl.textContent = message;
        statusEl.className = `status-message ${type}`;
        statusEl.style.display = message ? 'block' : 'none';

        if (message && type !== 'success') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 5000);
        }
    }

    // Helper function to show popup messages
    function showPopupMessage(message, type) {
        // Create popup overlay
        const popup = document.createElement('div');
        popup.className = 'popup-overlay';
        popup.innerHTML = `
            <div class="popup-content ${type}">
                <div class="popup-icon">
                    <ion-icon name="${type === 'success' ? 'checkmark-circle' : 'alert-circle'}"></ion-icon>
                </div>
                <div class="popup-message">${message}</div>
                <button class="popup-close">
                    <ion-icon name="close"></ion-icon>
                </button>
            </div>
        `;

        document.body.appendChild(popup);

        // Show popup with animation
        setTimeout(() => popup.classList.add('active'), 10);

        // Auto close after 4 seconds
        setTimeout(() => {
            popup.classList.remove('active');
            setTimeout(() => popup.remove(), 300);
        }, 4000);

        // Close on button click
        popup.querySelector('.popup-close').addEventListener('click', () => {
            popup.classList.remove('active');
            setTimeout(() => popup.remove(), 300);
        });
    }

    function updateUserUI(username) {
        // Replace login button with user dropdown
        const navRight = document.querySelector('.nav-right');
        if (!navRight) return;

        // Find and update/replace login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.outerHTML = `
                <div class="user-dropdown" id="userDropdown">
                    <button class="user-btn" id="userBtn">
                        <img src="https://mc-heads.net/avatar/${username}/32" alt="${username}">
                        <span>${escapeHtml(username)}</span>
                        <ion-icon name="chevron-down-outline"></ion-icon>
                    </button>
                    <div class="user-menu" id="userMenu">
                        <div class="user-menu-header">
                            <img src="https://mc-heads.net/avatar/${username}/64" alt="${username}">
                            <div class="user-info">
                                <strong>${escapeHtml(username)}</strong>
                                <span>Minecraft Player</span>
                            </div>
                        </div>
                        <div class="user-menu-divider"></div>
                        <button class="user-menu-item" id="purchaseHistoryBtn">
                            <ion-icon name="receipt-outline"></ion-icon>
                            <span>Purchase History</span>
                        </button>
                        <button class="user-menu-item" id="logoutBtn">
                            <ion-icon name="log-out-outline"></ion-icon>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            `;

            // Setup dropdown functionality
            setTimeout(() => {
                const userBtn = document.getElementById('userBtn');
                const userMenu = document.getElementById('userMenu');
                const logoutBtn = document.getElementById('logoutBtn');
                const purchaseHistoryBtn = document.getElementById('purchaseHistoryBtn');

                if (userBtn && userMenu) {
                    userBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        userMenu.classList.toggle('active');
                    });

                    // Close dropdown when clicking outside
                    document.addEventListener('click', (e) => {
                        if (!e.target.closest('.user-dropdown')) {
                            userMenu.classList.remove('active');
                        }
                    });
                }

                if (purchaseHistoryBtn) {
                    purchaseHistoryBtn.addEventListener('click', () => {
                        showPurchaseHistory();
                        userMenu.classList.remove('active');
                    });
                }

                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                        handleLogout();
                    });
                }
            }, 100);
        }
    }

    function handleLogout() {
        // Clear user data
        localStorage.removeItem('shopUser');

        // Clear cart data and reset cart counter
        cart = [];
        localStorage.removeItem('shopCart');
        updateCartCount();

        // Reset cart in the Shop class instance if it exists
        if (window.shop) {
            window.shop.cart = [];
            window.shop.updateCart();
            window.shop.updateCartCount();
        }

        // Reload page to reset UI
        window.location.reload();
    }

    // Helper function to get stored token
    function getStoredToken() {
        const storedUser = localStorage.getItem('shopUser');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                return userData.token || '';
            } catch (e) {
                console.error('Error parsing stored user data:', e);
            }
        }
        return '';
    }

    // Function to show purchase history
    function showPurchaseHistory() {
        // Create purchase history modal
        const modal = document.createElement('div');
        modal.className = 'modal purchase-history-modal';
        modal.innerHTML = `
            <div class="modal-content animate__animated animate__fadeInDown">
                <div class="modal-header">
                    <h2>
                        <ion-icon name="receipt-outline"></ion-icon>
                        Purchase History
                    </h2>
                    <button class="close-modal">
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>
                <div class="purchase-history-content">
                    <div class="loading-history">
                        <ion-icon name="hourglass-outline"></ion-icon>
                        <p>Loading your purchase history...</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Show modal
        setTimeout(() => modal.classList.add('active'), 10);

        // Load purchase history
        loadPurchaseHistory(modal);

        // Close modal functionality
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            }
        });
    }

    // Function to load purchase history from server
    async function loadPurchaseHistory(modal) {
        const content = modal.querySelector('.purchase-history-content');

        try {
            // Check if user is logged in (either with token or alternative login)
            const storedUser = localStorage.getItem('shopUser');
            let userData = null;
            let isLoggedIn = false;

            if (storedUser) {
                try {
                    userData = JSON.parse(storedUser);
                    const isRecent = userData.loginAt && (new Date() - new Date(userData.loginAt)) < (24 * 60 * 60 * 1000);
                    const hasAlternativeLogin = userData.alternativeLogin;
                    isLoggedIn = (userData.token && isRecent) || hasAlternativeLogin;
                } catch (e) {
                    console.error('Error parsing stored user data:', e);
                }
            }

            if (!isLoggedIn) {
                content.innerHTML = `
                    <div class="no-history">
                        <ion-icon name="alert-circle-outline"></ion-icon>
                        <p>Please login to view your purchase history</p>
                    </div>
                `;
                return;
            }

            // For alternative login users, pass credentials in headers
            const headers = {
                'Content-Type': 'application/json'
            };

            if (userData.alternativeLogin) {
                // For alternative login, include username and email in headers
                headers['x-username'] = userData.username;
                headers['x-email'] = userData.email;
                console.log('Sending purchase history request with alternative login:', userData.username, userData.email);
            } else {
                // For registered users, use token
                headers['Authorization'] = `Bearer ${userData.token}`;
                console.log('Sending purchase history request with token');
            }

            const response = await fetch('/api/purchase-history', {
                method: 'GET',
                headers: headers
            });

            if (response.ok) {
                const data = await response.json();
                displayPurchaseHistory(content, data.purchases || []);
            } else {
                content.innerHTML = `
                    <div class="no-history">
                        <ion-icon name="alert-circle-outline"></ion-icon>
                        <p>Failed to load purchase history</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading purchase history:', error);
            content.innerHTML = `
                <div class="no-history">
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <p>Network error. Please try again later.</p>
                </div>
            `;
        }
    }

    // Function to display purchase history
    function displayPurchaseHistory(container, purchases) {
        if (!purchases || purchases.length === 0) {
            container.innerHTML = `
                <div class="no-history">
                    <ion-icon name="basket-outline"></ion-icon>
                    <h3>No purchases yet</h3>
                    <p>Your purchase history will appear here once you make your first purchase.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="history-list">
                ${purchases.map(purchase => `
                    <div class="history-item">
                        <div class="history-item-header">
                            <div class="history-date">
                                <ion-icon name="calendar-outline"></ion-icon>
                                ${new Date(purchase.timestamp).toLocaleDateString()}
                            </div>
                            <div class="history-total">
                                <span class="currency">रु</span>${purchase.total.toLocaleString()}
                            </div>
                        </div>
                        <div class="history-items">
                            ${purchase.items.map(item => `
                                <div class="history-item-detail">
                                    <span class="item-name">${item.name}</span>
                                    <span class="item-quantity">x${item.quantity || 1}</span>
                                    <span class="item-price">रु${(item.priceNPR || item.price).toLocaleString()}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="history-status">
                            <span class="status-badge ${purchase.status || 'completed'}">
                                ${purchase.status || 'Completed'}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Check if user is already logged in on page load
    const storedUser = localStorage.getItem('shopUser');
    if (storedUser) {
        try {
            const userData = JSON.parse(storedUser);
            // Check if user data is recent (within 24 hours) or has alternative login
            const isRecent = userData.loginAt &&
                (new Date() - new Date(userData.loginAt)) < (24 * 60 * 60 * 1000); // 24 hours
            const hasAlternativeLogin = userData.alternativeLogin;

            if ((userData.token && isRecent) || hasAlternativeLogin) {
                updateUserUI(userData.username);
                currentUsername = userData.username;
                currentEmail = userData.email || '';
            } else {
                // Clear expired session
                localStorage.removeItem('shopUser');
            }
        } catch (e) {
            console.error('Error parsing stored user data:', e);
            localStorage.removeItem('shopUser');
        }
    }

    // Escape-safe HTML
    function escapeHtml(s){ return String(s).replace(/[&<>"]+/g, c=>({ '&':'&','<':'<','>':'>','"':'"' }[c])); }

    // Initialize cart from localStorage if available
    let savedCart = localStorage.getItem('shopCart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            updateCartCount();
        } catch (e) {
            console.error('Error parsing saved cart:', e);
            cart = [];
        }
    }

    // Responsive helper: compact mode under 768px
    function handleResize() {
        if (window.innerWidth < 768) document.body.classList.add('compact');
        else document.body.classList.remove('compact');
    }
    handleResize();
    window.addEventListener('resize', handleResize);

    // Enhanced product add-to-cart (delegation)
    document.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.add-to-cart-btn, .add-to-cart');
        if (!addBtn) return;

        // Prevent multiple clicks
        if (addBtn.classList.contains('loading')) return;

        // Add loading state
        addBtn.classList.add('loading');

        // Try to find product info in closest .product-card or .shop-item
        const card = addBtn.closest('.product-card, .shop-item');
        const title = card?.querySelector('.product-title, .item-title')?.textContent?.trim() || 'Item';
        const priceText = card?.querySelector('.product-price, .item-price')?.textContent?.trim() || '0';

        // Extract numeric price from text (handle both NPR and USD formats)
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;

        cart.push({ id: Date.now(), title, price, priceText });
        saveCart();
        updateCartCount();

        // Enhanced feedback animation
        addBtn.animate([
            { transform: 'translateY(-4px) scale(1.05)', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)' },
            { transform: 'translateY(0) scale(1)', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }
        ], { duration: 300, easing: 'ease-out' });

        // Show success state briefly
        setTimeout(() => {
            addBtn.classList.remove('loading');
            addBtn.classList.add('success');
            setTimeout(() => {
                addBtn.classList.remove('success');
            }, 800);
        }, 300);
    });

    // Enhanced navigation highlighting with smooth transitions
    const navLinks = document.querySelectorAll('.nav-link');
    try {
        const path = (location.pathname || '').split('/').pop() || 'index.html';
        navLinks.forEach(a => {
            const href = (a.getAttribute('href') || '').split('/').pop();
            if (href && href === path) a.classList.add('active');
        });
    } catch (err) { /* ignore */ }

    // Enhanced category filter interactions
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Visual feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => this.style.transform = '', 150);

            // Smooth transition for content change
            const productsGrid = document.getElementById('productsGrid');
            if (productsGrid) {
                productsGrid.style.opacity = '0.7';
                setTimeout(() => productsGrid.style.opacity = '1', 300);
            }
        });
    });

    // Enhanced search functionality
    const searchInput = document.getElementById('shopSearch');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                // Add subtle glow effect during search
                this.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.3)';
                setTimeout(() => this.style.boxShadow = '', 300);

                // Update shop search and re-render products
                if (window.shop) {
                    window.shop.searchQuery = this.value.trim();
                    window.shop.renderProducts();
                }
            }, 300);
        });
    }
});

// Discord webhook configuration
const DISCORD_WEBHOOK_CONFIG = {
    PURCHASE_WEBHOOK: 'https://discord.com/api/webhooks/1317583169381068811/2hR5n7tVQKlGUB4hGMO0s7o6kWJq_VrS1yYX8tMZG8eO0gXOgWj9P5OE6QE2kMhW3H',
    ERROR_WEBHOOK: 'https://discord.com/api/webhooks/1317583169381068811/2hR5n7tVQKlGUB4hGMO0s7o6kWJq_VrS1yYX8tMZG8eO0gXOgWj9P5OE6QE2kMhW3H'
};

// Database configuration
const DATABASE_CONFIG = {
    HOST: 'localhost',
    PORT: 3306,
    USER: 'root',
    PASSWORD: '',
    DATABASE: 'infinity_shop'
};

const SHOP_ITEMS = {
    ranks: [
        {
            id: 'vip',
            type: 'ranks',
            name: 'VIP Rank',
            priceNPR: 100,
            image: '../Assets/Images/Vip-r.png',
            description: '✦ VIP Chat Tag\n✦ 2 Home Points\n✦ Access to /fly'
        },
        {
            id: 'mvp',
            type: 'ranks',
            name: 'ELITE Rank',
            priceNPR: 200,
            image: '../Assets/Images/Elite-r.png',
            description: '✦ ELITE Chat Tag\n✦ 5 Home Points\n✦ Access to /fly'
        },
        {
            id: 'pro',
            type: 'ranks',
            name: 'NINJA Rank',
            priceNPR: 350,
            image: '../Assets/Images/King-r.png',
            description: '✦ NINJA Chat Tag\n✦ 8 Home Points\n✦ All Basic Commands'
        },
        {
            id: 'elite',
            type: 'ranks',
            name: 'KING Rank',
            priceNPR: 500,
            image: '../Assets/Images/Infinity-r.png',
            description: '✦ KING Chat Tag\n✦ 12 Home Points\n✦ All Commands'
        },
        {
            id: 'legend',
            type: 'ranks',
            name: 'Infinity Rank',
            priceNPR: 1000,
            image: '../Assets/Images/Boss-r.png',
            description: '✦ INFINITY Chat Tag\n✦ Unlimited Homes\n✦ All Features'
        }
    ],
    keys: [
        {
            id: 'manaslu-key',
            type: 'keys',
            name: 'Manaslu Key',
            priceNPR: 30,
            image: '../Assets/Images/terai.png',
            description: '✦ Opens Common Crates\n✦ Contains basic items\n✦ Low drop rates for rare items\n✦ Guaranteed basic rewards'
        },
        {
            id: 'makalu-key',
            type: 'keys',
            name: 'Makalu Key',
            priceNPR: 40,
            image: '../Assets/Images/pahadi.png',
            description: '✦ Opens Rare Crates\n✦ Better item chances\n✦ Includes enchanted items\n✦ Higher chance for valuable drops'
        },
        {
            id: 'lhotse-key',
            type: 'keys',
            name: 'Lhotse Key',
            priceNPR: 50,
            image: '../Assets/Images/himali.png',
            description: '✦ Opens Epic Crates\n✦ Premium item drops\n✦ Rare enchanted gear\n✦ Special cosmetic items included'
        },
        {
            id: 'infinity-key',
            type: 'keys',
            name: 'Infinity Key',
            priceNPR: 60,
            image: '../Assets/Images/infinity.png',
            description: '✦ Opens Infinity Crates\n✦ Highest tier rewards\n✦ Mythical items & cosmetics\n✦ Exclusive server perks'
        }
    ],
    coins: [
        {
            id: 'coins-1000',
            type: 'coins',
            name: '1,000 Coins',
            priceNPR: 100,
            image: '../Assets/Images/pile.png',
            description: '✦ 1,000 In-Game Coins\n✦ Basic currency for shops\n✦ Purchase common items\n✦ Stackable with other coin packs'
        },
        {
            id: 'coins-2000',
            type: 'coins',
            name: '2,000 Coins',
            priceNPR: 200,
            image: '../Assets/Images/pouch.png',
            description: '✦ 2,000 In-Game Coins\n✦ Great value pack\n✦ Buy rare items & upgrades\n✦ Popular choice for players'
        },
        {
            id: 'coins-3000',
            type: 'coins',
            name: '3,000 Coins',
            priceNPR: 300,
            image: '../Assets/Images/bucket.png',
            description: '✦ 3,000 In-Game Coins\n✦ Premium coin bundle\n✦ Access to special features\n✦ Best value for frequent buyers'
        },
        {
            id: 'coins-4000',
            type: 'coins',
            name: '4,000 Coins',
            priceNPR: 400,
            image: '../Assets/Images/chest.png',
            description: '✦ 4,000 In-Game Coins\n✦ Large currency pack\n✦ Unlock advanced content\n✦ Perfect for dedicated players'
        },
        {
            id: 'coins-5000',
            type: 'coins',
            name: '5,000 Coins',
            priceNPR: 500,
            image: '../Assets/Images/vault.png',
            description: '✦ 5,000 In-Game Coins\n✦ Maximum value pack\n✦ All premium features\n✦ Ultimate gaming experience'
        }
    ]
};

class Shop {
    constructor() {
        this.cart = [];
        this.currentFilter = 'all';
        this.currentSort = 'default';
        this.searchQuery = '';
        this.isLoggedIn = false;
        this.username = '';
        this.usdRate = 0;
        this.initializeShop();
        this.fetchExchangeRate();
        
        // Show loading state initially
        this.showLoadingState();
    }
    
    // Show loading state for products
    showLoadingState() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        
        const loadingEl = grid.querySelector('.loading-products');
        if (loadingEl) {
            loadingEl.style.display = 'flex';
        }
    }
    
    // Hide loading state
    hideLoadingState() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        
        const loadingEl = grid.querySelector('.loading-products');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    updateCartCount() {
        const countEl = document.getElementById('cartCount');
        if (!countEl) return;
        const totalItems = this.cart.length;
        countEl.textContent = totalItems;
    }

    setupPaymentModal() {
        const paymentModal = document.getElementById('paymentModal');
        const closePaymentModal = document.getElementById('closePaymentModal');

        if (!paymentModal) return;
        if (closePaymentModal) closePaymentModal.addEventListener('click', () => paymentModal.classList.remove('active'));
    }

    showTermsModal(selectedMode) {
        // Close payment mode modal
        const paymentModeModal = document.getElementById('paymentModeModal');
        if (paymentModeModal) paymentModeModal.classList.remove('active');

        // Show terms modal
        const termsModal = document.getElementById('termsModal');
        if (!termsModal) return;

        // Store selected mode for later use
        this.selectedPaymentMode = selectedMode;

        // Update currency in terms based on selected mode
        const paymentTermsSection = termsModal.querySelector('.terms-section:nth-child(4) ul li:first-child');
        if (paymentTermsSection) {
            const currencyText = selectedMode === 'international'
                ? '💵 <strong>Currency:</strong> All prices are in USD (United States Dollars)'
                : '💵 <strong>Currency:</strong> All prices are in Nepalese Rupees (NPR)';
            paymentTermsSection.innerHTML = currencyText;
        }

        // Enable/disable agree button based on scroll and checkbox
        const agreeBtn = termsModal.querySelector('#agreeTerms');
        const termsCheckbox = termsModal.querySelector('#termsCheckbox');
        const termsScrollable = termsModal.querySelector('.terms-scrollable');

        // Reset modal state
        if (termsCheckbox) termsCheckbox.checked = false;
        if (agreeBtn) agreeBtn.disabled = true;

        // Scroll to top when modal opens
        setTimeout(() => {
            if (termsScrollable) {
                termsScrollable.scrollTop = 0;
            }
        }, 100);

        // Function to check if user can agree
        const checkAgreementEligibility = () => {
            const hasScrolledToBottom = termsScrollable.scrollTop + termsScrollable.clientHeight >= termsScrollable.scrollHeight - 10;
            const hasAgreed = termsCheckbox.checked;
            if (agreeBtn) agreeBtn.disabled = !(hasScrolledToBottom && hasAgreed);
        };

        // Event listeners for scrolling and checkbox
        if (termsScrollable) {
            termsScrollable.addEventListener('scroll', checkAgreementEligibility);
        }
        if (termsCheckbox) {
            termsCheckbox.addEventListener('change', checkAgreementEligibility);
        }

        // Show modal
        termsModal.classList.add('active');

        // Force initial check after modal is shown
        setTimeout(checkAgreementEligibility, 200);

        // Handle modal close
        const closeModal = () => {
            termsModal.classList.remove('active');
            // Remove event listeners to prevent memory leaks
            if (termsScrollable) {
                termsScrollable.removeEventListener('scroll', checkAgreementEligibility);
            }
            if (termsCheckbox) {
                termsCheckbox.removeEventListener('change', checkAgreementEligibility);
            }
        };

        // Close modal events
        const termsModalClose = termsModal.querySelector('.terms-modal-close');
        const declineBtn = termsModal.querySelector('#declineTerms');
        const agreeBtnHandler = termsModal.querySelector('#agreeTerms');

        if (termsModalClose) {
            termsModalClose.addEventListener('click', closeModal);
        }
        if (declineBtn) {
            declineBtn.addEventListener('click', closeModal);
        }
        if (agreeBtnHandler) {
            agreeBtnHandler.addEventListener('click', () => {
                closeModal();
                this.showPaymentMethods(this.selectedPaymentMode);
            });
        }

        // Close on outside click
        termsModal.addEventListener('click', (e) => {
            if (e.target === termsModal) {
                closeModal();
            }
        });

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    showPaymentMethods(mode) {
        // Close terms modal
        const termsModal = document.getElementById('termsModal');
        if (termsModal) termsModal.classList.remove('active');

        // Show payment modal with appropriate methods for manual transaction
        const paymentModal = document.getElementById('paymentModal');
        const paymentMethodsContainer = document.getElementById('paymentMethodsContainer');
        const paymentModalTitle = document.getElementById('paymentModalTitle');
        const paymentInfoText = document.getElementById('paymentInfoText');

        if (!paymentModal || !paymentMethodsContainer || !paymentModalTitle || !paymentInfoText) return;

        if (mode === 'international') {
            paymentModalTitle.textContent = 'International Payment';
            paymentInfoText.textContent = 'Pay securely with PayPal. Click below to proceed with payment.';
            paymentMethodsContainer.innerHTML = `
                <button class="payment-option paypal-option" id="payPaypal">
                    <ion-icon name="logo-paypal"></ion-icon>
                    <span>Pay with PayPal</span>
                </button>
            `;

            // Add PayPal button event
            const payPaypalBtn = document.getElementById('payPaypal');
            if (payPaypalBtn) {
                payPaypalBtn.addEventListener('click', () => {
                    paymentModal.classList.remove('active');
                    this.showPaypalPaymentForm();
                });
            }
        } else if (mode === 'local') {
            paymentModalTitle.textContent = 'Local Payment Methods';
            paymentInfoText.textContent = 'Choose from popular Nepalese payment methods. Fast and secure processing.';
            paymentMethodsContainer.innerHTML = `
                <button class="payment-option esewa-option" id="payEsewa">
                    <ion-icon name="phone-portrait-outline"></ion-icon>
                    <span>eSewa (Active)</span>
                </button>
                <button class="payment-option khalti-option" id="payKhalti">
                    <ion-icon name="wallet-outline"></ion-icon>
                    <span>Khalti (Active)</span>
                </button>
                <button class="payment-option connectips-option disabled" id="payConnectIPS">
                    <ion-icon name="card-outline"></ion-icon>
                    <span>ConnectIPS (Coming Soon)</span>
                </button>
            `;

            // Add payment button events
            const payEsewaBtn = document.getElementById('payEsewa');
            if (payEsewaBtn) {
                payEsewaBtn.addEventListener('click', () => {
                    paymentModal.classList.remove('active');
                    this.showEsewaPaymentForm();
                });
            }

            const payKhaltiBtn = document.getElementById('payKhalti');
            if (payKhaltiBtn) {
                payKhaltiBtn.addEventListener('click', () => {
                    paymentModal.classList.remove('active');
                    this.showKhaltiPaymentForm();
                });
            }

            const payConnectIPSBtn = document.getElementById('payConnectIPS');
            if (payConnectIPSBtn) {
                payConnectIPSBtn.addEventListener('click', () => {
                    paymentModal.classList.remove('active');
                    // TODO: Show ConnectIPS payment form
                    alert('ConnectIPS payment selected. Coming soon!');
                });
            }
        }

        paymentModal.classList.add('active');
    }

    // eSewa Payment Form
    showEsewaPaymentForm() {
        const modal = document.getElementById('esewaPaymentModal');
        const amountEl = document.getElementById('esewaAmount');

        // Calculate total amount
        const totalNPR = this.cart.reduce((sum, item) => {
            const itemPrice = item.priceNPR || Math.round((item.price || 0) * (this.usdRate || 1));
            const quantity = item.quantity || 1;
            return sum + (itemPrice * quantity);
        }, 0);

        if (amountEl) amountEl.textContent = `NPR ${totalNPR.toLocaleString()}`;

        modal.classList.add('active');

        // Handle form submission
        const form = document.getElementById('esewaPaymentForm');
        const cancelBtn = document.getElementById('cancelEsewaPayment');
        const closeModalBtn = document.getElementById('closeEsewaModal');

        const closeModal = () => modal.classList.remove('active');

        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.processEsewaPayment(form);
                closeModal();
            });
        }
    }

    // Khalti Payment Form
    showKhaltiPaymentForm() {
        const modal = document.getElementById('khaltiPaymentModal');
        const amountEl = document.getElementById('khaltiAmount');

        // Calculate total amount
        const totalNPR = this.cart.reduce((sum, item) => {
            const itemPrice = item.priceNPR || Math.round((item.price || 0) * (this.usdRate || 1));
            const quantity = item.quantity || 1;
            return sum + (itemPrice * quantity);
        }, 0);

        if (amountEl) amountEl.textContent = `NPR ${totalNPR.toLocaleString()}`;

        modal.classList.add('active');

        // Handle form submission
        const form = document.getElementById('khaltiPaymentForm');
        const cancelBtn = document.getElementById('cancelKhaltiPayment');
        const closeModalBtn = document.getElementById('closeKhaltiModal');

        const closeModal = () => modal.classList.remove('active');

        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.processKhaltiPayment(form);
                closeModal();
            });
        }
    }

    // PayPal Payment Form
    showPaypalPaymentForm() {
        const modal = document.getElementById('paypalPaymentModal');
        const amountEl = document.getElementById('paypalAmount');

        // Calculate total amount
        const totalNPR = this.cart.reduce((sum, item) => {
            const itemPrice = item.priceNPR || Math.round((item.price || 0) * (this.usdRate || 1));
            const quantity = item.quantity || 1;
            return sum + (itemPrice * quantity);
        }, 0);

        const totalUSD = this.usdRate ? (totalNPR / this.usdRate).toFixed(2) : '0.00';

        if (amountEl) amountEl.textContent = `$${totalUSD}`;

        modal.classList.add('active');

        // Handle form submission
        const form = document.getElementById('paypalPaymentForm');
        const cancelBtn = document.getElementById('cancelPaypalPayment');
        const closeModalBtn = document.getElementById('closePaypalModal');

        const closeModal = () => modal.classList.remove('active');

        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.processPaypalPayment(form);
                closeModal();
            });
        }
    }

    // Process eSewa Payment
    async processEsewaPayment(form) {
        const formData = new FormData(form);
        const transactionId = formData.get('esewaTransactionId')?.trim();
        const phoneNumber = formData.get('esewaPhoneNumber')?.trim();
        const username = formData.get('esewaUsername')?.trim();

        if (!transactionId || !phoneNumber || !username) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        // Validate phone number format
        if (!/^9[78][0-9]{8}$/.test(phoneNumber)) {
            this.showToast('Please enter a valid phone number (98xxxxxxxx)', 'error');
            return;
        }

        // Show loading
        const submitBtn = form.querySelector('.submit-payment-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Processing...';

        try {
            // Prepare payment data
            const totalNPR = this.cart.reduce((sum, item) => {
                const itemPrice = item.priceNPR || Math.round((item.price || 0) * (this.usdRate || 1));
                const quantity = item.quantity || 1;
                return sum + (itemPrice * quantity);
            }, 0);

            const paymentData = {
                method: 'esewa',
                transactionId,
                phoneNumber,
                username,
                amount: totalNPR,
                currency: 'NPR',
                items: this.cart,
                timestamp: new Date().toISOString()
            };

            // Send to server
            const response = await fetch('/api/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Khalti payment processed successfully:', result);
                this.showPurchaseSuccess();
                this.cart = [];
                this.updateCart();
                this.updateCartCount();

                // Close cart sidebar if open
                const cartSidebar = document.getElementById('cartSidebar');
                if (cartSidebar) cartSidebar.classList.remove('active');
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Khalti payment processing failed:', response.status, errorData);
                throw new Error(`Payment processing failed: ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            console.error('eSewa payment error:', error);
            this.showToast('Payment processing failed. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<ion-icon name="checkmark-circle-outline"></ion-icon> Submit Payment';
        }
    }

    // Process Khalti Payment
    async processKhaltiPayment(form) {
        const formData = new FormData(form);
        const transactionId = formData.get('khaltiTransactionId')?.trim();
        const phoneNumber = formData.get('khaltiPhoneNumber')?.trim();
        const username = formData.get('khaltiUsername')?.trim();

        if (!transactionId || !phoneNumber || !username) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        // Validate phone number format
        if (!/^9[78][0-9]{8}$/.test(phoneNumber)) {
            this.showToast('Please enter a valid phone number (98xxxxxxxx)', 'error');
            return;
        }

        // Show loading
        const submitBtn = form.querySelector('.submit-payment-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Processing...';

        try {
            // Prepare payment data
            const totalNPR = this.cart.reduce((sum, item) => {
                const itemPrice = item.priceNPR || Math.round((item.price || 0) * (this.usdRate || 1));
                const quantity = item.quantity || 1;
                return sum + (itemPrice * quantity);
            }, 0);

            const paymentData = {
                method: 'khalti',
                transactionId,
                phoneNumber,
                username,
                amount: totalNPR,
                currency: 'NPR',
                items: this.cart,
                timestamp: new Date().toISOString()
            };

            // Send to server
            const response = await fetch('/api/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Payment processed successfully:', result);
                this.showPurchaseSuccess();
                this.cart = [];
                this.updateCart();
                this.updateCartCount();

                // Close cart sidebar if open
                const cartSidebar = document.getElementById('cartSidebar');
                if (cartSidebar) cartSidebar.classList.remove('active');
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Payment processing failed:', response.status, errorData);
                throw new Error(`Payment processing failed: ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            console.error('Khalti payment error:', error);
            this.showToast('Payment processing failed. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<ion-icon name="checkmark-circle-outline"></ion-icon> Submit Payment';
        }
    }

    // Process PayPal Payment
    async processPaypalPayment(form) {
        const formData = new FormData(form);
        const transactionId = formData.get('paypalTransactionId')?.trim();
        const email = formData.get('paypalEmail')?.trim();
        const username = formData.get('paypalUsername')?.trim();

        if (!transactionId || !email || !username) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        // Show loading
        const submitBtn = form.querySelector('.submit-payment-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Processing...';

        try {
            // Prepare payment data
            const totalNPR = this.cart.reduce((sum, item) => {
                const itemPrice = item.priceNPR || Math.round((item.price || 0) * (this.usdRate || 1));
                const quantity = item.quantity || 1;
                return sum + (itemPrice * quantity);
            }, 0);

            const totalUSD = this.usdRate ? (totalNPR / this.usdRate).toFixed(2) : '0.00';

            const paymentData = {
                method: 'paypal',
                transactionId,
                email,
                username,
                amount: totalUSD,
                currency: 'USD',
                items: this.cart,
                timestamp: new Date().toISOString()
            };

            // Send to server
            const response = await fetch('/api/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('PayPal payment processed successfully:', result);
                this.showPurchaseSuccess();
                this.cart = [];
                this.updateCart();
                this.updateCartCount();

                // Close cart sidebar if open
                const cartSidebar = document.getElementById('cartSidebar');
                if (cartSidebar) cartSidebar.classList.remove('active');
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('PayPal payment processing failed:', response.status, errorData);
                throw new Error(`Payment processing failed: ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            console.error('PayPal payment error:', error);
            this.showToast('Payment processing failed. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<ion-icon name="checkmark-circle-outline"></ion-icon> Submit Payment';
        }
    }

    // Show purchase success notification
    showPurchaseSuccess() {
        const notification = document.createElement('div');
        notification.className = 'purchase-success-notification';
        notification.innerHTML = `
            <div class="success-content">
                <div class="success-icon">
                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                </div>
                <div class="success-text">
                    <h3>Thank You for Your Purchase! 🎉</h3>
                    <p>Your payment has been submitted successfully. Our team will verify your transaction and activate your items within 24 hours.</p>
                    <p>You will receive a confirmation email with your purchase details.</p>
                </div>
                <button class="close-success-btn">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Add close functionality
        const closeBtn = notification.querySelector('.close-success-btn');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);

        // Show toast as well
        this.showToast('Payment submitted successfully! Check your email for confirmation.', 'success');
    }

    async fetchExchangeRate() {
        try {
            const response = await fetch(CONFIG.CURRENCY_API);
            const data = await response.json();
            this.usdRate = 1 / data.rates.USD; // NPR to USD conversion rate
            this.renderShopItems(); // Re-render items with new rates
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
        }
    }

    initializeShop() {
        this.setupEventListeners();
        this.renderShopItems();
        this.updateServerStatus();
        this.setupSearchFilter();
        this.setupSortOptions();
        this.renderFeaturedItems();
        setInterval(() => this.updateServerStatus(), CONFIG.UPDATE_INTERVAL);
        
        // Simulate loading time for demo purposes
        setTimeout(() => this.hideLoadingState(), 1000);
    }
    
    // Enhanced sort dropdown functionality
    setupSortOptions() {
        const sortSelect = document.getElementById('sortOptions');
        if (!sortSelect) return;

        sortSelect.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderShopItems();

            // Visual feedback for sort change
            sortSelect.style.transform = 'scale(0.98)';
            setTimeout(() => sortSelect.style.transform = '', 200);
        });
    }
    
    // Render featured items in the sidebar
    renderFeaturedItems() {
        const featuredContainer = document.getElementById('featuredItems');
        if (!featuredContainer) return;

        // Clear container
        featuredContainer.innerHTML = '';

        // Fetch popular items from server
        this.fetchPopularItems().then(popularItems => {
            // Get all items
            const allItems = [...SHOP_ITEMS.ranks, ...SHOP_ITEMS.keys, ...SHOP_ITEMS.coins];

            let featuredItems = [];

            if (popularItems && popularItems.length > 0) {
                // Use popular items as featured
                featuredItems = popularItems.map(popular => {
                    return allItems.find(item => item.id === popular.id);
                }).filter(item => item); // Remove undefined items
            }

            // If no popular items or less than 3, fill with default featured items
            if (featuredItems.length < 3) {
                const defaultFeatured = allItems.filter(item => CONFIG.FEATURED_ITEMS.includes(item.id));
                const remainingSlots = 3 - featuredItems.length;
                const additionalItems = defaultFeatured.slice(0, remainingSlots);
                featuredItems = [...featuredItems, ...additionalItems];
            }

            if (featuredItems.length === 0) {
                featuredContainer.innerHTML = '<p class="no-featured">No featured items available</p>';
                return;
            }

            // Create featured item elements
            featuredItems.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'featured-item';

                // Determine price display
                let priceDisplay = '';
                if (item.priceNPR) {
                    priceDisplay = `<span style="color: var(--success);">रु</span> ${item.priceNPR.toLocaleString()}`;
                } else if (item.price) {
                    priceDisplay = `$${item.price.toFixed(2)}`;
                }

                itemEl.innerHTML = `
                    <div class="featured-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="featured-item-details">
                        <h4 class="featured-item-title">${item.name}</h4>
                        <p class="featured-item-price">${priceDisplay}</p>
                    </div>
                `;

                // Add click event to navigate to the item
                itemEl.addEventListener('click', () => {
                    // Scroll to the item in the main grid
                    const itemInGrid = document.querySelector(`.product-card[data-id="${item.id}"]`);
                    if (itemInGrid) {
                        itemInGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        itemInGrid.classList.add('highlight-item');
                        setTimeout(() => itemInGrid.classList.remove('highlight-item'), 2000);
                    }
                });

                featuredContainer.appendChild(itemEl);
            });
        }).catch(error => {
            console.error('Error loading popular items:', error);
            // Fallback to default featured items
            this.renderDefaultFeaturedItems();
        });
    }

    // Fetch popular items from server
    async fetchPopularItems() {
        try {
            const response = await fetch('/api/popular-items');
            const data = await response.json();
            return data.popular || [];
        } catch (error) {
            console.error('Error fetching popular items:', error);
            return [];
        }
    }

    // Fallback method for default featured items
    renderDefaultFeaturedItems() {
        const featuredContainer = document.getElementById('featuredItems');
        if (!featuredContainer) return;

        // Clear container
        featuredContainer.innerHTML = '';

        // Get all items
        const allItems = [...SHOP_ITEMS.ranks, ...SHOP_ITEMS.keys, ...SHOP_ITEMS.coins];

        // Filter featured items
        const featuredItems = allItems.filter(item => CONFIG.FEATURED_ITEMS.includes(item.id));

        if (featuredItems.length === 0) {
            featuredContainer.innerHTML = '<p class="no-featured">No featured items available</p>';
            return;
        }

        // Create featured item elements
        featuredItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'featured-item';

            // Determine price display
            let priceDisplay = '';
            if (item.priceNPR) {
                priceDisplay = `<span style="color: var(--success);">रु</span> ${item.priceNPR.toLocaleString()}`;
            } else if (item.price) {
                priceDisplay = `$${item.price.toFixed(2)}`;
            }

            itemEl.innerHTML = `
                <div class="featured-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="featured-item-details">
                    <h4 class="featured-item-title">${item.name}</h4>
                    <p class="featured-item-price">${priceDisplay}</p>
                </div>
            `;

            // Add click event to navigate to the item
            itemEl.addEventListener('click', () => {
                // Scroll to the item in the main grid
                const itemInGrid = document.querySelector(`.product-card[data-id="${item.id}"]`);
                if (itemInGrid) {
                    itemInGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    itemInGrid.classList.add('highlight-item');
                    setTimeout(() => itemInGrid.classList.remove('highlight-item'), 2000);
                }
            });

            featuredContainer.appendChild(itemEl);
        });
    }

    setupSearchFilter() {
        const searchInput = document.getElementById('shopSearch');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderShopItems();
        });
    }

    async updateServerStatus() {
        try {
            const response = await fetch(`https://api.mcsrvstat.us/2/${CONFIG.MINECRAFT_SERVER}`);
            const data = await response.json();

            this.serverStatus = data.online ? 'online' : 'offline';
            const statusEl = document.getElementById('srv-status');
            if (statusEl) {
                statusEl.textContent = this.serverStatus.charAt(0).toUpperCase() + this.serverStatus.slice(1);
                statusEl.className = `value status-${this.serverStatus}`;
            }

            const playersEl = document.getElementById('srv-players');
            if (playersEl) {
                if (data.online && data.players) {
                    playersEl.textContent = `${data.players.online || 0}/${data.players.max || 0}`;
                } else {
                    playersEl.textContent = '0/0';
                }
            }

            const ipEl = document.getElementById('srv-ip');
            if (ipEl) {
                ipEl.textContent = CONFIG.MINECRAFT_SERVER.split(':')[0];
            }
        } catch (error) {
            console.error('Error updating server status:', error);
            this.serverStatus = 'offline';
            const statusEl = document.getElementById('srv-status');
            if (statusEl) {
                statusEl.textContent = 'Offline';
                statusEl.className = 'value status-offline';
            }
            const playersEl = document.getElementById('srv-players');
            if (playersEl) playersEl.textContent = '0/0';
            const ipEl = document.getElementById('srv-ip');
            if (ipEl) ipEl.textContent = CONFIG.MINECRAFT_SERVER.split(':')[0];
        }
    }
    
    // Update the online players widget in the sidebar
    updateOnlinePlayersWidget() {
        const widget = document.getElementById('onlinePlayersWidget');
        if (!widget) return;
        
        // Clear widget
        widget.innerHTML = '';
        
        if (!this.onlinePlayers || this.onlinePlayers.length === 0) {
            widget.innerHTML = '<p class="no-players">No players online</p>';
            return;
        }
        
        // Create player elements
        this.onlinePlayers.forEach(player => {
            const playerEl = document.createElement('div');
            playerEl.className = 'player-item';
            playerEl.innerHTML = `
                <div class="player-head">
                    <img src="https://mc-heads.net/avatar/${player}" alt="${player}">
                </div>
                <div class="player-name">${player}</div>
            `;
            widget.appendChild(playerEl);
        });
    }

    setupEventListeners() {
        // Enhanced category buttons with better visual feedback
        const categoryFilters = document.querySelector('.category-filters');
        if (categoryFilters) {
            categoryFilters.addEventListener('click', (e) => {
                const btn = e.target.closest('.category-btn');
                if (btn) {
                    e.preventDefault();
                    this.currentFilter = btn.dataset.category;
                    this.updateActiveFilter();
                    this.renderShopItems();

                    // Enhanced visual feedback with ripple effect
                    const ripple = document.createElement('div');
                    ripple.style.position = 'absolute';
                    ripple.style.borderRadius = '50%';
                    ripple.style.background = 'rgba(255,255,255,0.3)';
                    ripple.style.transform = 'scale(0)';
                    ripple.style.animation = 'ripple 0.6s linear';
                    ripple.style.left = '50%';
                    ripple.style.top = '50%';
                    ripple.style.width = '20px';
                    ripple.style.height = '20px';
                    ripple.style.marginLeft = '-10px';
                    ripple.style.marginTop = '-10px';
                    ripple.style.pointerEvents = 'none';

                    btn.style.position = 'relative';
                    btn.appendChild(ripple);

                    setTimeout(() => ripple.remove(), 600);
                }
            });
        }

        // Cart close button (class .close-cart)
        document.querySelectorAll('.close-cart').forEach(btn => {
            btn.addEventListener('click', () => {
                const sidebar = document.getElementById('cartSidebar');
                const overlay = document.querySelector('.cart-overlay');
                if (sidebar) sidebar.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
            });
        });

        // Checkout button (id checkoutBtn) -> show payment mode selection modal
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                const paymentModeModal = document.getElementById('paymentModeModal');
                if (paymentModeModal) paymentModeModal.classList.add('active');
            });
        }

        // Payment mode buttons
        const internationalModeBtn = document.getElementById('internationalModeBtn');
        const localModeBtn = document.getElementById('localModeBtn');

        if (internationalModeBtn) {
            internationalModeBtn.addEventListener('click', () => {
                this.showTermsModal('international');
            });
        }

        if (localModeBtn) {
            localModeBtn.addEventListener('click', () => {
                this.showTermsModal('local');
            });
        }

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Modal close (class .close-modal)
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = btn.closest('.modal');
                if (modal) modal.classList.remove('active');
            });
        });

        // Close payment mode modal specifically
        const closePaymentModeModal = document.getElementById('closePaymentModeModal');
        if (closePaymentModeModal) {
            closePaymentModeModal.addEventListener('click', () => {
                const paymentModeModal = document.getElementById('paymentModeModal');
                if (paymentModeModal) paymentModeModal.classList.remove('active');
            });
        }
        // Wire payment modal buttons
        this.setupPaymentModal();
    }

    updateActiveFilter() {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === this.currentFilter);
        });
    }

    renderShopItems() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        
        // Clear grid except for loading indicator
        const loadingEl = grid.querySelector('.loading-products');
        grid.innerHTML = '';
        if (loadingEl) grid.appendChild(loadingEl);

        let items = [];
        if (this.currentFilter === 'all') {
            items = [...SHOP_ITEMS.ranks, ...SHOP_ITEMS.keys, ...SHOP_ITEMS.coins];
        } else {
            items = SHOP_ITEMS[this.currentFilter] || [];
        }

        // Apply search filter
        if (this.searchQuery) {
            items = items.filter(item => 
                item.name.toLowerCase().includes(this.searchQuery) ||
                item.description.toLowerCase().includes(this.searchQuery)
            );
        }
        
        // Apply sorting
        if (this.currentSort !== 'default') {
            items = this.sortItems(items, this.currentSort);
        }

        if (items.length === 0) {
            grid.innerHTML = `
                <div class="no-results animate__animated animate__fadeIn">
                    <ion-icon name="search-outline"></ion-icon>
                    <h3>No items found</h3>
                    <p>Try adjusting your search or filter</p>
                </div>
            `;
            return;
        }

        items.forEach((item, index) => {
            const itemElement = this.createShopItem(item);
            itemElement.style.animationDelay = `${index * 0.1}s`;
            grid.appendChild(itemElement);
        });
    }
    
    // Sort items based on selected sort option
    sortItems(items, sortOption) {
        const itemsCopy = [...items];
        
        switch (sortOption) {
            case 'price-low':
                return itemsCopy.sort((a, b) => {
                    const priceA = a.priceNPR || (a.price * (this.usdRate || 1));
                    const priceB = b.priceNPR || (b.price * (this.usdRate || 1));
                    return priceA - priceB;
                });
            case 'price-high':
                return itemsCopy.sort((a, b) => {
                    const priceA = a.priceNPR || (a.price * (this.usdRate || 1));
                    const priceB = b.priceNPR || (b.price * (this.usdRate || 1));
                    return priceB - priceA;
                });
            case 'name-asc':
                return itemsCopy.sort((a, b) => a.name.localeCompare(b.name));
            case 'name-desc':
                return itemsCopy.sort((a, b) => b.name.localeCompare(a.name));
            default:
                return itemsCopy;
        }
    }

    createShopItem(item) {
    const div = document.createElement('div');
    // mark new items as initially hidden; the observer in shop-animations.js will reveal them
    div.className = 'shop-item initial-hidden';
        div.dataset.type = item.type;
        div.dataset.id = item.id;

        const description = item.description.split('\n').map(line => 
            `<li>${line.trim()}</li>`
        ).join('');
        
        // Determine prices (support items defined in NPR or in USD)
        let priceNPR = null;
        let priceUSD = null;
        if (typeof item.priceNPR !== 'undefined') {
          priceNPR = item.priceNPR;
          priceUSD = this.usdRate ? (priceNPR / this.usdRate).toFixed(2) : '...';
        } else if (typeof item.price !== 'undefined') {
          // item.price assumed to be USD
          priceUSD = item.price;
          priceNPR = this.usdRate ? Math.round(priceUSD * this.usdRate) : null;
        }

        // Check for admin-applied sales
        if (window.productSales && window.productSales[item.id]) {
          const saleInfo = window.productSales[item.id];
          if (saleInfo.percentage > 0) {
            priceNPR = Math.round(priceNPR * (1 - saleInfo.percentage / 100));
            priceUSD = (priceNPR / this.usdRate).toFixed(2);
          }
        }

        const usdPriceText = priceUSD !== null ? `$${Number(priceUSD).toFixed(2)}` : '...';
        const nprPriceText = priceNPR !== null ? `<span style="color: var(--success);">रु</span> <span style="color: white;">${priceNPR.toLocaleString()}</span>` : '<span style="color: var(--success);">रु</span> <span style="color: white;">-</span>';

        // Add badges for special items
        let badgeHTML = '';
        if (CONFIG.NEW_ITEMS.includes(item.id)) {
            badgeHTML = `<span class="product-badge badge-new">New</span>`;
        } else if (CONFIG.SALE_ITEMS.includes(item.id)) {
            badgeHTML = `<span class="product-badge badge-sale">Sale</span>`;
        } else if (CONFIG.POPULAR_ITEMS.includes(item.id)) {
            badgeHTML = `<span class="product-badge badge-popular">Popular</span>`;
        }

        div.innerHTML = `
            ${badgeHTML}
            <span class="item-type">${item.type}</span>
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}" loading="lazy">
            </div>
            <h3 class="item-title${item.id === 'legend' ? ' legend-rank' : item.id === 'elite' ? ' king-rank' : item.id === 'mvp' ? ' elite-rank' : item.id === 'pro' ? ' ninja-rank' : item.id === 'vip' ? ' vip-rank' : ''}">${item.id === 'legend' ? '<span class="infinity-text">INFINITY</span> Rank' : item.id === 'elite' ? '<span class="king-text">KING</span> Rank' : item.id === 'mvp' ? '<span class="elite-text">ELITE</span> Rank' : item.id === 'pro' ? '<span class="ninja-text">NINJA</span> Rank' : item.id === 'vip' ? '<span class="vip-text">VIP</span> Rank' : item.name}</h3>
            <div class="price-container">
                <p class="item-price">${nprPriceText}</p>
                <p class="usd-price">(≈ ${usdPriceText})</p>
            </div>
            <ul class="item-description">${description}</ul>
            <button class="quick-view-btn" data-id="${item.id}">
                <ion-icon name="eye-outline"></ion-icon>
                Quick View
            </button>
            <div class="product-actions">
                <div class="quantity-selector">
                    <button class="quantity-btn quantity-decrease">-</button>
                    <input type="number" class="quantity-input" value="1" min="1" max="99">
                    <button class="quantity-btn quantity-increase">+</button>
                </div>
                <button class="add-to-cart" data-id="${item.id}">
                    <ion-icon name="cart-outline"></ion-icon>
                    Add to Cart
                </button>
            </div>
        `;

        // Add to cart button event
        div.querySelector('.add-to-cart').addEventListener('click', () => {
            const quantityInput = div.querySelector('.quantity-input');
            const quantity = parseInt(quantityInput?.value || 1, 10);
            this.addToCart(item, quantity);
            
            // Show toast notification
            this.showToast(`Added ${quantity} ${item.name} to cart`, 'success');
        });
        
        // Quantity selector events
        const quantityInput = div.querySelector('.quantity-input');
        const decreaseBtn = div.querySelector('.quantity-decrease');
        const increaseBtn = div.querySelector('.quantity-increase');
        
        if (quantityInput && decreaseBtn && increaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                let value = parseInt(quantityInput.value, 10);
                if (value > 1) {
                    quantityInput.value = value - 1;
                }
            });
            
            increaseBtn.addEventListener('click', () => {
                let value = parseInt(quantityInput.value, 10);
                if (value < 99) {
                    quantityInput.value = value + 1;
                }
            });
            
            quantityInput.addEventListener('change', () => {
                let value = parseInt(quantityInput.value, 10);
                if (isNaN(value) || value < 1) {
                    quantityInput.value = 1;
                } else if (value > 99) {
                    quantityInput.value = 99;
                }
            });
        }
        
        // Quick view button event
        div.querySelector('.quick-view-btn').addEventListener('click', () => {
            this.showQuickView(item);
        });

        return div;
    }
    
    // Show toast notification
    showToast(message, type = 'info') {
        // Check if toast container exists, if not create it
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Set icon based on type
        let icon = 'information-circle-outline';
        if (type === 'success') icon = 'checkmark-circle-outline';
        if (type === 'error') icon = 'alert-circle-outline';
        
        toast.innerHTML = `
            <ion-icon name="${icon}" class="toast-icon"></ion-icon>
            <div class="toast-message">${message}</div>
            <button class="toast-close">
                <ion-icon name="close-outline"></ion-icon>
            </button>
        `;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Add close button event
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // Show quick view modal for an item
    showQuickView(item) {
        // Check if quick view modal exists, if not create it
        let quickViewModal = document.getElementById('quickViewModal');
        if (!quickViewModal) {
            quickViewModal = document.createElement('div');
            quickViewModal.id = 'quickViewModal';
            quickViewModal.className = 'modal';
            quickViewModal.style.zIndex = '9999'; // Ensure modal is on top
            document.body.appendChild(quickViewModal);
        }
        
        // Determine prices
        let priceNPR = null;
        let priceUSD = null;
        if (typeof item.priceNPR !== 'undefined') {
            priceNPR = item.priceNPR;
            priceUSD = this.usdRate ? (priceNPR / this.usdRate).toFixed(2) : '...';
        } else if (typeof item.price !== 'undefined') {
            priceUSD = item.price;
            priceNPR = this.usdRate ? Math.round(priceUSD * this.usdRate) : null;
        }

        const usdPriceText = priceUSD !== null ? `$${Number(priceUSD).toFixed(2)}` : '...';
        const nprPriceText = priceNPR !== null ? `<span style="color: var(--success);">रु</span> <span style="color: white;">${priceNPR.toLocaleString()}</span>` : '<span style="color: var(--success);">रु</span> <span style="color: white;">-</span>';

        // Format description
        const description = item.description.split('\n').map(line => 
            `<li>${line.trim()}</li>`
        ).join('');
        
        // Set modal content with better visibility
        quickViewModal.innerHTML = `
            <div class="modal-content animate__animated animate__fadeInDown" style="background: rgba(26, 26, 26, 0.98); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                <div class="modal-header">
                    <h2 style="color: var(--text);">${item.name}</h2>
                    <button class="close-modal" style="background: rgba(255,255,255,0.1); border: none; color: var(--text-muted);">
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>
                <div class="quick-view-content">
                    <div class="quick-view-image">
                        <img src="${item.image}" alt="${item.name}" style="max-width: 100%; max-height: 300px; border-radius: 12px;">
                    </div>
                    <div class="quick-view-details">
                        <div class="quick-view-price">
                            <h3 style="color: var(--success);">${nprPriceText}</h3>
                            <p style="color: var(--text-muted);">(≈ ${usdPriceText})</p>
                        </div>
                        <div class="quick-view-description">
                            <h4 style="color: var(--text);">Description</h4>
                            <ul style="color: var(--text-muted);">${description}</ul>
                        </div>
                        <div class="quick-view-actions">
                            <div class="quantity-selector">
                                <button class="quantity-btn quantity-decrease">-</button>
                                <input type="number" class="quantity-input" value="1" min="1" max="99">
                                <button class="quantity-btn quantity-increase">+</button>
                            </div>
                            <button class="add-to-cart-btn" data-id="${item.id}">
                                <ion-icon name="cart-outline"></ion-icon>
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Show modal without flicker
        setTimeout(() => {
            quickViewModal.classList.add('active');
        }, 10);

        // Close button event
        quickViewModal.querySelector('.close-modal').addEventListener('click', () => {
            quickViewModal.classList.remove('active');
        });
        
        // Quantity selector events
        const quantityInput = quickViewModal.querySelector('.quantity-input');
        const decreaseBtn = quickViewModal.querySelector('.quantity-decrease');
        const increaseBtn = quickViewModal.querySelector('.quantity-increase');
        
        if (quantityInput && decreaseBtn && increaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                let value = parseInt(quantityInput.value, 10);
                if (value > 1) {
                    quantityInput.value = value - 1;
                }
            });
            
            increaseBtn.addEventListener('click', () => {
                let value = parseInt(quantityInput.value, 10);
                if (value < 99) {
                    quantityInput.value = value + 1;
                }
            });
            
            quantityInput.addEventListener('change', () => {
                let value = parseInt(quantityInput.value, 10);
                if (isNaN(value) || value < 1) {
                    quantityInput.value = 1;
                } else if (value > 99) {
                    quantityInput.value = 99;
                }
            });
        }
        
        // Add to cart button event
        quickViewModal.querySelector('.add-to-cart-btn').addEventListener('click', () => {
            const quantity = parseInt(quantityInput?.value || 1, 10);
            this.addToCart(item, quantity);
            
            // Show toast notification
            this.showToast(`Added ${quantity} ${item.name} to cart`, 'success');
            
            // Close modal
            quickViewModal.classList.remove('active');
        });
        
        // Close modal when clicking outside
        quickViewModal.addEventListener('click', (e) => {
            if (e.target === quickViewModal) {
                quickViewModal.classList.remove('active');
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && quickViewModal.classList.contains('active')) {
                quickViewModal.classList.remove('active');
            }
        });
    }

    addToCart(item, quantity = 1) {
        // Check if item is already in cart
        const existingItem = this.cart.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
            // Update quantity
            existingItem.quantity = (existingItem.quantity || 1) + quantity;
        } else {
            // Add new item with quantity
            const itemWithQuantity = { ...item, quantity };
            this.cart.push(itemWithQuantity);
        }
        
        this.updateCart();
        this.updateCartCount();
        
        // Show cart sidebar
        const sidebarEl = document.getElementById('cartSidebar');
        if (sidebarEl) sidebarEl.classList.add('active');
        
        // Save cart to localStorage
        localStorage.setItem('shopCart', JSON.stringify(this.cart));
    }

    updateCart() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');

        cartItems.innerHTML = '';

        this.cart.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <p class="cart-item-price">${(item.priceNPR || Math.round((item.price || 0) * (this.usdRate || 1))).toLocaleString()}</p>
                    ${item.quantity > 1 ? `<p class="cart-item-quantity">Qty: ${item.quantity}</p>` : ''}
                </div>
                <button class="cart-item-remove" data-index="${index}">
                    <ion-icon name="trash-outline"></ion-icon>
                </button>
            `;

            itemElement.querySelector('.cart-item-remove').addEventListener('click', () => {
                this.removeFromCart(index);
            });

            cartItems.appendChild(itemElement);
        });

        // Calculate total with quantity
        const totalNPR = this.cart.reduce((sum, item) => {
            const itemPrice = item.priceNPR || Math.round((item.price || 0) * (this.usdRate || 1));
            const quantity = item.quantity || 1;
            return sum + (itemPrice * quantity);
        }, 0);
        const totalUSD = this.usdRate ? (totalNPR / this.usdRate).toFixed(2) : '...';
        if (cartTotal) cartTotal.innerHTML = `${totalNPR.toLocaleString()}`;
        this.updateCartCount();
    }

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.updateCart();
        this.updateCartCount();
        // Save updated cart to localStorage
        localStorage.setItem('shopCart', JSON.stringify(this.cart));

        // Also update the global cart variable used in the DOM event handlers
        cart = this.cart;
    }

    logout() {
        this.isLoggedIn = false;
        this.username = '';
        // restore login button in nav
        const actions = document.querySelector('.nav-actions');
        if (actions) {
            actions.innerHTML = `
                <button id="loginBtn" class="login-btn">
                    <ion-icon name="person-outline"></ion-icon>
                    <span>Login</span>
                </button>
                <button id="cartBtn" class="cart-btn">
                    <ion-icon name="bag-outline"></ion-icon>
                    <span class="cart-text">Cart</span>
                    <span id="cartCount" class="cart-count">${this.cart.length}</span>
                </button>
            `;

            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) loginBtn.addEventListener('click', () => this.showLoginModal());
        }
    }

    showLoginModal() {
        const m = document.getElementById('loginModal');
        if (m) m.classList.add('active');
    }

    async handleLogin() {
        // Accept any username — skip Mojang verification per request
        const usernameInput = document.getElementById('minecraftUsername');
        const username = usernameInput ? usernameInput.value.trim() : '';
        if (!username) {
            alert('Please enter a username');
            return;
        }

        this.isLoggedIn = true;
        this.username = username;

        // Close modal
        const m = document.getElementById('loginModal');
        if (m) m.classList.remove('active');



        // Update nav: show player head and welcome with dropdown menu
        const actions = document.querySelector('.nav-actions');
        if (actions) {
            actions.innerHTML = `
                <div class="user-section" id="userSection" tabindex="0">
                    <img src="https://mc-heads.net/avatar/${username}" alt="${username}">
                    <div class="user-name">${username}</div>
                    <div class="user-menu" id="userMenu" aria-hidden="true">
                        <div class="user-menu-header">
                            <img class="user-menu-head" src="https://mc-heads.net/avatar/${username}" alt="${username}">
                            <div class="user-menu-info"><strong>${username}</strong><div style="font-size:12px;opacity:0.8">Minecraft Player</div></div>
                        </div>
                        <button id="logoutBtn" class="logout-btn">Logout</button>
                    </div>
                </div>
                <button id="cartBtn" class="cart-btn">
                    <ion-icon name="bag-outline"></ion-icon>
                    <span class="cart-text">Cart</span>
                    <span id="cartCount" class="cart-count">${this.cart.length}</span>
                </button>
            `;

            // Wire logout
            const logout = document.getElementById('logoutBtn');
            if (logout) logout.addEventListener('click', () => this.logout());

            // Wire user dropdown toggle
            const userSection = document.getElementById('userSection');
            const userMenu = document.getElementById('userMenu');
            if (userSection && userMenu) {
                userSection.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const open = userMenu.classList.toggle('open');
                    userMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
                });

                // close user menu when clicking outside
                document.addEventListener('click', (ev) => {
                    if (!userSection.contains(ev.target)) {
                        userMenu.classList.remove('open');
                        userMenu.setAttribute('aria-hidden', 'true');
                    }
                });
            }
        }
    }

    async verifyMinecraftAccount(username) {
        // Here you would implement your actual Minecraft account verification
        // This is a placeholder implementation
        try {
            const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
            return response.ok;
        } catch (error) {
            console.error('Verification error:', error);
            return false;
        }
    }

    renderOnlinePlayers() {
        const playersGrid = document.getElementById('playersGrid');
        if (!playersGrid) return;

        playersGrid.innerHTML = '';

        if (this.onlinePlayers.length === 0) {
            playersGrid.innerHTML = `
                <div class="no-players animate__animated animate__fadeIn">
                    <ion-icon name="people-outline"></ion-icon>
                    <p>No players online</p>
                </div>
            `;
            return;
        }

        this.onlinePlayers.forEach((player, index) => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-item animate__animated animate__fadeIn';
            playerElement.style.animationDelay = `${index * 0.1}s`;
            playerElement.innerHTML = `
                <div class="player-head">
                    <img src="https://mc-heads.net/avatar/${player}" alt="${player}">
                </div>
                <div class="player-name">${player}</div>
            `;
            playersGrid.appendChild(playerElement);
        });
    }

    showConfirmationModal() {
        const modal = document.getElementById('confirmationModal');
        const itemsContainer = modal.querySelector('.confirm-items');
        const totalNPR = document.getElementById('confirmTotalNPR');
        const totalUSD = document.getElementById('confirmTotalUSD');

        // Clear previous items
        itemsContainer.innerHTML = '';

        // Add items to confirmation
        this.cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'confirm-item';
            const itemPrice = item.priceNPR || Math.round((item.price || 0) * (this.usdRate || 1));
            const quantity = item.quantity || 1;
            const totalPrice = itemPrice * quantity;
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="confirm-item-details">
                    <h4>${item.name}</h4>
                    ${quantity > 1 ? `<p class="confirm-quantity">Qty: ${quantity}</p>` : ''}
                    <p><span style="color: var(--success);">रु</span> ${totalPrice.toLocaleString()}</p>
                </div>
            `;
            itemsContainer.appendChild(itemElement);
        });

        // Calculate totals with quantity
        const totalInNPR = this.cart.reduce((sum, item) => {
            const itemPrice = item.priceNPR || Math.round((item.price || 0) * (this.usdRate || 1));
            const quantity = item.quantity || 1;
            return sum + (itemPrice * quantity);
        }, 0);
        const totalInUSD = this.usdRate ? (totalInNPR / this.usdRate).toFixed(2) : '...';

        totalNPR.textContent = totalInNPR.toLocaleString();
        totalUSD.textContent = totalInUSD;

        // Show modal
        modal.classList.add('active');

        // Handle purchase finalization
        document.getElementById('finalizeBtn').onclick = () => this.processCheckout();
    }

    async processCheckout() {
        if (this.cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        if (!this.isLoggedIn) {
            this.showLoginModal();
            return;
        }

        try {
            const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
            const totalAmount = this.cart.reduce((sum, item) => sum + item.priceNPR, 0);

            // Show processing state
            const finalizeBtn = document.getElementById('finalizeBtn');
            finalizeBtn.disabled = true;
            finalizeBtn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Processing...';

            // Here you would implement your actual payment processing
            // This is a simulation
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Simulate successful payment
            document.getElementById('confirmationModal').classList.remove('active');

            // Show success message inline (avoid extra modal stacking)
            const successEl = document.createElement('div');
            successEl.className = 'purchase-success animate__animated animate__fadeIn';
            successEl.innerHTML = `
                <div style="max-width:600px;margin:20px auto;padding:1.5rem;border-radius:12px;background:rgba(0,0,0,0.6);text-align:center;color:var(--text-light);">
                    <div style="font-size:48px;color:var(--success);margin-bottom:0.5rem;">✓</div>
                    <h2>Purchase Successful!</h2>
                    <p>Thank you for your purchase, <strong>${this.username}</strong>!</p>
                    <p>Your items will be delivered when you join the server.</p>
                </div>
            `;
            document.body.appendChild(successEl);
            setTimeout(() => successEl.remove(), 6000);

            // Create public notification for all users to see
            this.showPublicPurchaseNotification(this.username, this.cart);

            // Clear cart
            this.cart = [];
            this.updateCart();
            const sidebar = document.getElementById('cartSidebar');
            if (sidebar) sidebar.classList.remove('active');

        } catch (error) {
            console.error('Checkout error:', error);
            alert('Error processing checkout. Please try again.');
        }
    }

    // Show public purchase notification visible to all users
    showPublicPurchaseNotification(username, items) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'public-purchase-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <ion-icon name="gift-outline"></ion-icon>
                <div class="notification-text">
                    <strong>${username}</strong> just purchased ${items.length} item${items.length > 1 ? 's' : ''}!
                    <div class="notification-items">
                        ${items.map(item => `<span class="item-name">${item.name}</span>`).join(', ')}
                    </div>
                </div>
                <button class="close-notification">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Add close functionality
        const closeBtn = notification.querySelector('.close-notification');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }
}

// Load product sales from server
async function loadProductSales() {
  try {
    const response = await fetch('/api/admin/product-sales');
    const data = await response.json();
    if (data.ok) {
      window.productSales = data.sales;
    }
  } catch (error) {
    console.error('Error loading product sales:', error);
    window.productSales = {};
  }
}

// Initialize shop when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load product sales first
    await loadProductSales();

    window.shop = new Shop();

});
