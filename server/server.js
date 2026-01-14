require('dotenv').config({ path: '../.env' });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const path = require('path');
const axios = require('axios');

const db = require('./db');

async function startServer() {

const app = express();

const PORT = process.env.PORT || 3000;

// Discord webhook configuration
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DISCORD_STAFF_ROLE_ID = process.env.DISCORD_STAFF_ROLE_ID; // Add this to your .env file

console.log('DISCORD_STAFF_ROLE_ID:', DISCORD_STAFF_ROLE_ID);
console.log('DISCORD_WEBHOOK_URL:', DISCORD_WEBHOOK_URL ? 'configured' : 'not configured');

// Function to send Discord notification
async function sendDiscordNotification(purchase, isVerified = false) {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('Discord webhook URL not configured, skipping notification');
    return;
  }

  try {
    // Format items for display
    let itemsText = '';
    if (typeof purchase.items === 'string') {
      try {
        const items = JSON.parse(purchase.items);
        itemsText = items.map(item => `${item.name} (x${item.quantity})`).join(', ');
      } catch (e) {
        itemsText = purchase.items;
      }
    } else if (Array.isArray(purchase.items)) {
      itemsText = purchase.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
    } else {
      itemsText = 'Unknown items';
    }

    const embed = {
      title: isVerified ? '✅ Purchase Verified' : '🛒 New Purchase Completed',
      color: isVerified ? 0x10b981 : 0x6366f1,
      fields: [
        {
          name: 'Username',
          value: purchase.username,
          inline: true
        },
        {
          name: 'Product Name',
          value: itemsText,
          inline: true
        },
        {
          name: 'Paid Price',
          value: `$${purchase.amount}`,
          inline: true
        },
        {
          name: 'Verification Status',
          value: isVerified ? 'Verified' : 'Unverified',
          inline: false
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Infinity Realms Shop'
      }
    };

    const webhookData = {
      embeds: [embed]
    };

    // Add role ping only for unverified purchases if staff role ID is configured
    if (DISCORD_STAFF_ROLE_ID && !isVerified) {
      webhookData.content = `<@&${DISCORD_STAFF_ROLE_ID}>`;
    }

    await axios.post(DISCORD_WEBHOOK_URL, webhookData);

    console.log('Discord notification sent successfully');
  } catch (error) {
    console.error('Error sending Discord notification:', error.message);
  }
}

app.use(cors());
app.use(bodyParser.json());

// Initialize database connection (skip if MySQL not available for testing Discord)
(async () => {
  try {
    await db.init();
  } catch (error) {
    console.log('Database initialization skipped (MySQL not available) - Discord testing mode');
  }
})();

const { clearAllData, manualClearData } = require('./db');

// Database initialization - Auto-create tables and clear data for fresh deployment
// This will run on every server start to ensure clean state

// Production payment endpoints
// Integration with eSewa/Khalti APIs should be implemented here
// For now, these endpoints are disabled for production safety
// Uncomment and implement proper payment provider integration when ready

// Process payment endpoint
app.post('/api/process-payment', async (req, res) => {
  const { method, transactionId, phoneNumber, username, amount, currency, items, timestamp } = req.body;

  if (!method || !transactionId || !username || !amount || !items) {
    return res.status(400).json({ error: 'Missing required payment fields' });
  }

  try {
    // Create purchase record
    const purchaseData = {
      id: uuidv4(),
      username,
      email: req.body.email || '',
      minecraft_username: username,
      items: JSON.stringify(items),
      amount: parseFloat(amount),
      provider: method,
      status: 'unverified',
      ip: req.ip || req.connection.remoteAddress || '',
      transaction_id: transactionId,
      phone_number: phoneNumber || '',
      currency: currency || 'NPR',
      timestamp: timestamp ? new Date(timestamp) : new Date()
    };

    // Save to database
    await db.createPurchase(purchaseData);

    // Send Discord notification for new unverified purchase
    await sendDiscordNotification(purchaseData, false);

    console.log(`Purchase created for ${username}: ${JSON.stringify(items)} - Status: unverified`);
    console.log('Discord notification sent for unverified purchase');

    res.json({ success: true, message: 'Payment submitted successfully. Awaiting verification.' });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Discord webhooks are used in real purchase processing (verify-purchase endpoint)

// User authentication endpoints
app.post('/api/register', async (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Check if user already exists
    const existingUser = await db.getUserByUsername(username) || await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Create user in database
    await db.createUser({ username, email });

    // Generate JWT token
    const token = jwt.sign({ username, email }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });

    res.json({ success: true, message: 'Registration successful', token });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, email, token } = req.body;

  if (!username || !email || !token) {
    return res.status(400).json({ error: 'Username, email, and token are required' });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    if (decoded.username !== username || decoded.email !== email) {
      return res.status(400).json({ error: 'Token does not match provided username and email' });
    }

    // Verify user exists in database
    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    console.log(`User logged in: ${username} (${email})`);

    res.json({
      success: true,
      user: {
        username: username,
        email: email
      }
    });

  } catch (error) {
    console.error('Error logging in:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Login failed' });
  }
});

// Alternative login endpoint for users without tokens (simplified authentication)
app.post('/api/login-alternative', async (req, res) => {
  const { username, email } = req.body;

  try {
    // Check if user exists in database
    const user = await db.getUserByUsername(username);

    // Always allow login - create user if they don't exist
    if (!user) {
      // Create the user automatically
      await db.createUser({ username, email });
      console.log(`Created new user: ${username} (${email})`);
    }

    console.log(`Alternative login for ${username} (${email})`);

    res.json({
      success: true,
      user: {
        username: username,
        email: email
      }
    });
  } catch (error) {
    console.error('Error in alternative login:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get popular items based on purchase history
app.get('/api/popular-items', async (req, res) => {
  try {
    const purchases = await db.getPurchases();
    const itemCounts = {};

    purchases.forEach(purchase => {
      try {
        const items = purchase.items; // Already parsed in db.getPurchases()
        items.forEach(item => {
          if (item.id) {
            itemCounts[item.id] = (itemCounts[item.id] || 0) + (item.quantity || 1);
          }
        });
      } catch (e) {
        // Skip invalid items
      }
    });

    // Sort by purchase count and take top 5
    const sortedItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ id, count }));

    res.json({ popular: sortedItems });
  } catch (error) {
    console.error('Error getting popular items:', error);
    res.status(500).json({ error: 'Failed to get popular items' });
  }
});

// Get purchase history for a user
app.get('/api/purchase-history', async (req, res) => {
  try {
    const { authorization } = req.headers;
    let username = null;

    // Check for Bearer token (registered users)
    if (authorization && authorization.startsWith('Bearer ')) {
      const token = authorization.substring(7); // Remove 'Bearer ' prefix
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        username = decoded.username;
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }

    // If no token or invalid token, try alternative login method
    if (!username) {
      // Check for alternative login credentials in headers or query params
      const altUsername = req.headers['x-username'] || req.query.username;
      const altEmail = req.headers['x-email'] || req.query.email;

      console.log('Purchase history request headers:', {
        'x-username': req.headers['x-username'],
        'x-email': req.headers['x-email'],
        query: req.query
      });

      if (altUsername && altEmail) {
        // For alternative login, just use the provided credentials (don't verify against DB)
        username = altUsername;
        console.log(`Using alternative login credentials for ${username} (${altEmail})`);
      }
    }

    if (!username) {
      return res.status(401).json({ error: 'Please login to view your purchase history' });
    }

    // Get all purchases for this user
    const allPurchases = await db.getPurchases();
    const userPurchases = allPurchases.filter(purchase => purchase.username === username);

    // Format purchases for frontend
    const formattedPurchases = userPurchases.map(purchase => {
      let items = [];
      try {
        items = purchase.items; // Already parsed in db.getPurchases()
      } catch (e) {
        items = [];
      }

      return {
        id: purchase.id,
        timestamp: purchase.created_at,
        total: purchase.amount,
        status: purchase.status,
        items: items
      };
    });

    res.json({ purchases: formattedPurchases });

  } catch (error) {
    console.error('Error getting purchase history:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Failed to get purchase history' });
  }
});

// Admin endpoints
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) return res.json({ ok: true });
  return res.status(401).json({ ok: false });
});

app.post('/api/admin/clear-database', async (req, res) => {
  try {
    await manualClearData();
    res.json({ ok: true, message: 'Database cleared successfully' });
  } catch (error) {
    console.error('Error clearing database:', error);
    res.status(500).json({ ok: false, error: 'Failed to clear database' });
  }
});

// Shop management endpoints
app.get('/api/admin/products', async (req, res) => {
  try {
    // Return all products with their current sale status
    // We need to dynamically load SHOP_ITEMS since it's defined in the client-side JS
    // For now, we'll define a comprehensive product list here
    const allProducts = [
      // Ranks
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
      },
      // Keys
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
      },
      // Coins
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
    ];

    // Add sale information to products (this would be stored in memory or database)
    // For now, we'll return products without sale info, and the admin panel will manage sales separately
    res.json({ ok: true, products: allProducts });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ ok: false, error: 'Failed to get products' });
  }
});

app.post('/api/admin/apply-global-sale', (req, res) => {
  try {
    const { percentage } = req.body;
    if (percentage < 0 || percentage > 90) {
      return res.status(400).json({ ok: false, error: 'Invalid percentage' });
    }

    // Apply sale to all products
    const applySaleToCategory = (category) => {
      category.forEach(item => {
        item.originalPrice = item.originalPrice || item.priceNPR;
        item.salePercentage = percentage;
        item.priceNPR = Math.round(item.originalPrice * (1 - percentage / 100));
      });
    };

    applySaleToCategory(SHOP_ITEMS.ranks);
    applySaleToCategory(SHOP_ITEMS.keys);
    applySaleToCategory(SHOP_ITEMS.coins);

    console.log(`Applied ${percentage}% global sale`);
    res.json({ ok: true, message: `Applied ${percentage}% sale to all products` });
  } catch (error) {
    console.error('Error applying global sale:', error);
    res.status(500).json({ ok: false, error: 'Failed to apply global sale' });
  }
});

app.post('/api/admin/remove-global-sale', (req, res) => {
  try {
    // Remove sale from all products
    const removeSaleFromCategory = (category) => {
      category.forEach(item => {
        if (item.originalPrice) {
          item.priceNPR = item.originalPrice;
          delete item.originalPrice;
          delete item.salePercentage;
        }
      });
    };

    removeSaleFromCategory(SHOP_ITEMS.ranks);
    removeSaleFromCategory(SHOP_ITEMS.keys);
    removeSaleFromCategory(SHOP_ITEMS.coins);

    console.log('Removed global sale');
    res.json({ ok: true, message: 'Removed sale from all products' });
  } catch (error) {
    console.error('Error removing global sale:', error);
    res.status(500).json({ ok: false, error: 'Failed to remove global sale' });
  }
});

app.post('/api/admin/apply-product-sale', (req, res) => {
  try {
    const { productId, percentage } = req.body;
    if (!productId || percentage < 0 || percentage > 90) {
      return res.status(400).json({ ok: false, error: 'Invalid product ID or percentage' });
    }

    // For now, we'll store sale information in memory
    // In a real application, this would be stored in the database
    if (!global.productSales) {
      global.productSales = {};
    }

    global.productSales[productId] = {
      percentage: percentage,
      appliedAt: new Date()
    };

    console.log(`Applied ${percentage}% sale to product ${productId}`);
    res.json({ ok: true, message: `Applied ${percentage}% sale to product` });
  } catch (error) {
    console.error('Error applying product sale:', error);
    res.status(500).json({ ok: false, error: 'Failed to apply product sale' });
  }
});

app.post('/api/admin/remove-product-sale', (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ ok: false, error: 'Product ID required' });
    }

    // Remove sale information from memory
    if (global.productSales && global.productSales[productId]) {
      delete global.productSales[productId];
    }

    console.log(`Removed sale from product ${productId}`);
    res.json({ ok: true, message: 'Removed sale from product' });
  } catch (error) {
    console.error('Error removing product sale:', error);
    res.status(500).json({ ok: false, error: 'Failed to remove product sale' });
  }
});

// Get product sale information
app.get('/api/admin/product-sales', (req, res) => {
  try {
    const sales = global.productSales || {};
    res.json({ ok: true, sales });
  } catch (error) {
    console.error('Error getting product sales:', error);
    res.status(500).json({ ok: false, error: 'Failed to get product sales' });
  }
});

app.get('/api/admin/purchases', async (req, res) => {
  try {
    const all = await db.getPurchases();
    res.json({ ok: true, purchases: all });
  } catch (error) {
    console.error('Error getting admin purchases:', error);
    res.status(500).json({ ok: false, error: 'Failed to get purchases' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json({ ok: true, users });
  } catch (error) {
    console.error('Error getting admin users:', error);
    res.status(500).json({ ok: false, error: 'Failed to get users' });
  }
});

app.post('/api/admin/verify-purchase', async (req, res) => {
  const { purchaseId } = req.body;
  if (!purchaseId) return res.status(400).json({ ok: false, error: 'missing purchaseId' });

  try {
    await db.updatePurchaseVerification(purchaseId, 'verified');
    await db.updatePurchaseStatus(purchaseId, 'verified');

    // Fetch purchase details for Discord notification
    const purchases = await db.getPurchases();
    const purchase = purchases.find(p => p.id === purchaseId);
    if (purchase) {
      await sendDiscordNotification(purchase, true); // true for verified status
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('Error verifying purchase:', error);
    return res.status(500).json({ ok: false, error: 'Failed to verify purchase' });
  }
});

app.post('/api/admin/announce', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ ok: false, error: 'missing message' });
  // RCON functionality removed - can be added back later if needed
  console.log(`Admin announcement: ${message}`);
  return res.json({ ok: true });
});

// Serve admin and static files (if present)
app.get('/jun_ki_mkc', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'admin.html'));
});
app.use('/jun_ki_mkc', express.static(path.join(__dirname, '..', 'admin')));
app.use('/admin.css', express.static(path.join(__dirname, '..', 'admin', 'admin.css')));
app.use('/admin.js', express.static(path.join(__dirname, '..', 'admin', 'admin.js')));
app.use('/', express.static(path.join(__dirname, '..')));

  app.listen(PORT, () => console.log(`Infinity Realms server running on port ${PORT}`));
}

startServer().catch(console.error);
