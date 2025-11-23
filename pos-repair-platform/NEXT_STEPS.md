# Next Steps - Implementation Guide

## ✅ What's Been Completed

1. ✅ Twilio SMS and Email notification system integrated
2. ✅ Store phone and email fields added to database schema
3. ✅ Registration form updated with phone/email fields
4. ✅ Backend services updated to use store's phone/email
5. ✅ Docker containers rebuilt and running

## 🔧 Step 1: Run Database Migration

The database needs to be updated with the new `storePhone` and `notificationEmail` fields.

### Option A: Run Migration SQL Directly (Recommended)

```bash
# Connect to PostgreSQL and run the migration
cd pos-repair-platform/apps/api
docker-compose exec postgres psql -U postgres -d pos_repair_platform -c "ALTER TABLE \"Store\" ADD COLUMN IF NOT EXISTS \"storePhone\" TEXT;"
docker-compose exec postgres psql -U postgres -d pos_repair_platform -c "ALTER TABLE \"Store\" ADD COLUMN IF NOT EXISTS \"notificationEmail\" TEXT;"
```

### Option B: Run via Docker Container

```bash
cd pos-repair-platform/apps/api
docker-compose exec api node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$executeRaw\`ALTER TABLE \"Store\" ADD COLUMN IF NOT EXISTS \"storePhone\" TEXT\`.then(() => {
  return prisma.\$executeRaw\`ALTER TABLE \"Store\" ADD COLUMN IF NOT EXISTS \"notificationEmail\" TEXT\`;
}).then(() => {
  console.log('Migration completed');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
"
```

## 📧 Step 2: Configure Twilio and SMTP

### 2.1 Set Up Twilio Account

1. **Sign up for Twilio**: https://www.twilio.com/try-twilio
2. **Get your credentials**:
   - Account SID
   - Auth Token
   - Phone Number (buy one or use trial number)

3. **Add to environment variables**:

Create or update `.env` file in `pos-repair-platform/` directory:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# SMTP Configuration (for Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourstore.com
```

### 2.2 Set Up SMTP (Email)

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character app password

**For Other Providers:**
- Outlook: `smtp-mail.outlook.com:587`
- Custom SMTP: Use your provider's settings

### 2.3 Update Docker Compose

The environment variables are already configured in `docker-compose.yml`. You can either:

1. **Add to `.env` file** (recommended):
   ```bash
   cd pos-repair-platform
   # Create .env file with your credentials
   ```

2. **Or set directly in docker-compose.yml** (not recommended for production)

3. **Restart containers**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## 🧪 Step 3: Test the System

### 3.1 Test Registration with Phone/Email

1. **Open registration page**: http://localhost:3001/register
2. **Fill in the form**:
   - Owner Name
   - Store Name
   - Store Email (required)
   - **Store Phone Number** (optional, e.g., `+1234567890`)
   - **Notification Email** (optional, defaults to store email)
   - PIN
   - Confirm PIN

3. **Submit and verify**:
   - Registration should succeed
   - Store should be created with phone/email

### 3.2 Test Notifications

1. **Create a customer** with phone and/or email
2. **Create a repair ticket** for that customer
3. **Update ticket status** (e.g., from RECEIVED to IN_PROGRESS)
4. **Check for notifications**:
   - SMS should be sent to customer's phone (from store's phone)
   - Email should be sent to customer's email (from store's notification email)

### 3.3 Check Logs

```bash
# View API logs
docker-compose logs -f api

# Look for:
# - "Twilio client initialized"
# - "Email transporter initialized"
# - "SMS sent successfully to..."
# - "Email sent successfully to..."
```

## 🔍 Step 4: Verify Everything Works

### Check Database

```bash
# Verify columns were added
docker-compose exec postgres psql -U postgres -d pos_repair_platform -c "\d \"Store\""
```

You should see:
- `storePhone` (TEXT, nullable)
- `notificationEmail` (TEXT, nullable)

### Check API Endpoints

```bash
# Test API health
curl http://localhost:3000/

# Test registration endpoint (should accept phone/email)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "ownerName": "Test Owner",
    "storeName": "Test Store",
    "storeEmail": "test@example.com",
    "storePhone": "+1234567890",
    "notificationEmail": "notifications@example.com",
    "pin": "1234"
  }'
```

## 📝 Step 5: Update Existing Stores (Optional)

If you have existing stores, you can update them with phone/email:

```bash
# Via API (after logging in)
PATCH /stores/{id}
{
  "storePhone": "+1234567890",
  "notificationEmail": "notifications@example.com"
}
```

Or directly in database:
```sql
UPDATE "Store" 
SET "storePhone" = '+1234567890', 
    "notificationEmail" = 'notifications@example.com' 
WHERE id = 'your-store-id';
```

## 🚨 Troubleshooting

### Phone Number Field Not Showing

1. **Hard refresh browser**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Clear browser cache**
3. **Check browser console** for errors (F12)

### Notifications Not Sending

1. **Check Twilio credentials** are correct
2. **Verify phone number** is in E.164 format (`+1234567890`)
3. **Check SMTP credentials** are correct
4. **Review API logs**: `docker-compose logs api`
5. **Verify customer** has phone/email in database

### Database Migration Issues

If Prisma migration fails, run SQL directly:
```bash
docker-compose exec postgres psql -U postgres -d pos_repair_platform
```

Then run:
```sql
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "storePhone" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "notificationEmail" TEXT;
```

## 📚 Documentation

- **Twilio Setup**: See `apps/api/TWILIO_SETUP.md`
- **Store Notifications**: See `STORE_NOTIFICATIONS_SETUP.md`
- **API Documentation**: Check Postman collection

## 🎯 Quick Start Checklist

- [ ] Run database migration
- [ ] Set up Twilio account and get credentials
- [ ] Set up SMTP (Gmail or other)
- [ ] Add credentials to `.env` file
- [ ] Restart Docker containers
- [ ] Test registration with phone/email
- [ ] Create a test ticket
- [ ] Update ticket status and verify notifications
- [ ] Check logs for confirmation

## 🆘 Need Help?

1. Check API logs: `docker-compose logs -f api`
2. Check web logs: `docker-compose logs -f web`
3. Verify environment variables: `docker-compose exec api env | grep -E "(TWILIO|SMTP)"`
4. Test Twilio connection: Check Twilio console for message logs
5. Test SMTP: Check email provider's sent folder

---

**You're all set!** The system is ready to send SMS and email notifications using each store's own phone number and email address.


