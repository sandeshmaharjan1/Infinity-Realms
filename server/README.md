Infinity Shop Server - Production Ready
======================================

This is a production-ready Node.js/Express server for the Infinity Realms shop, featuring MySQL database storage, user authentication, and Discord webhooks for notifications.

Important Security Notes:
- Change all default passwords and secrets in production
- Use HTTPS in production (required for cPanel deployment)
- Regularly backup your database
- Monitor logs for suspicious activity

## cPanel Deployment Instructions

### 1. Prepare Your Files
1. Upload the entire server directory to your cPanel File Manager or via FTP
2. Upload the root .env file to your server

### 2. Database Setup
1. Create a MySQL database in cPanel's MySQL Databases section
2. Create a database user and grant all privileges
3. Update your .env file with the database credentials:
   ```
   DB_HOST=localhost
   DB_USER=your_cpanel_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_cpanel_db_name
   ```

### 3. Node.js Application Setup
1. Go to cPanel → Software → Setup Node.js App
2. Create a new application with:
   - Application root: `/home/yourusername/server` (or your server directory)
   - Application URL: Choose a subdomain or subfolder
   - Node.js version: 18+ (latest stable)
3. Set environment variables in cPanel Node.js Manager or update your .env file
4. Install dependencies: `npm install`
5. Start the application

### 4. Environment Configuration
Update your .env file with production values:
```
PORT=3000
JWT_SECRET=your_secure_jwt_secret_here
ADMIN_PASSWORD=your_secure_admin_password
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_id/your_webhook_token
DISCORD_STAFF_ROLE_ID=your_staff_role_id
BASE_URL=https://yourdomain.com
```

### 5. Additional cPanel Setup
- Configure SSL certificate (Let's Encrypt recommended)
- Set up domain/subdomain pointing to your Node.js app
- Configure firewall rules if needed
- Set up email forwarding for monitoring

### 6. Testing
- Test all API endpoints after deployment
- Verify Discord webhooks are working
- Test user registration and purchase submission
- Check admin panel access

### 7. Production Monitoring
- Monitor server logs regularly
- Set up automated backups
- Keep Node.js and dependencies updated
- Monitor database performance

## Available API Endpoints

### User Authentication
- `POST /api/register` — Register new user account
- `POST /api/login` — User login with JWT
- `POST /api/login-alternative` — Simplified login

### Payment Processing
- `POST /api/process-payment` — Submit payment for verification (integrate with eSewa/Khalti)

### Admin Functions
- `POST /api/admin/login` — Admin authentication
- `GET /api/admin/users` — View all users
- `GET /api/admin/purchases` — View all purchases
- `POST /api/admin/verify-purchase` — Verify and complete purchase
- `POST /api/admin/announce` — Send announcements

### Analytics
- `GET /api/popular-items` — Get popular items data
- `GET /api/purchase-history` — Get user purchase history (requires auth)

### Testing
- `POST /api/test-discord` — Test Discord webhook (remove after setup)

## Security Recommendations
- Use strong, unique passwords
- Enable 2FA on cPanel account
- Regularly update all software
- Monitor access logs
- Use HTTPS exclusively
- Validate all user inputs
- Rate limit API endpoints
