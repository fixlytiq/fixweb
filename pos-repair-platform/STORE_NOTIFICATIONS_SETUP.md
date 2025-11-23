# Store-Based Notification System

## Overview

The system now uses each store's own phone number and email address as the sender for customer notifications. When a store is created during registration, the owner can provide:
- **Store Phone Number**: Used as the "from" number for SMS notifications
- **Notification Email**: Used as the "from" address for email notifications (defaults to store email if not provided)

## What Changed

### Database Changes

1. **Store Model** (`prisma/schema.prisma`):
   - Added `storePhone` (String, optional): Store's phone number for SMS notifications
   - Added `notificationEmail` (String, optional): Email address for sending notifications

2. **Migration**: Created migration to add these fields to existing stores

### Backend Changes

1. **DTOs Updated**:
   - `RegisterDto`: Added optional `storePhone` and `notificationEmail`
   - `CreateStoreDto`: Added optional `storePhone` and `notificationEmail`
   - `UpdateStoreDto`: Added optional `storePhone` and `notificationEmail`

2. **Services Updated**:
   - `AuthService`: Captures phone and email during registration
   - `StoresService`: Handles phone and email in create/update operations
   - `NotificationsService`: Uses store's phone/email as sender instead of global config
   - `TicketsService`: Passes store phone/email to notification service

3. **Notification Logic**:
   - **SMS**: Uses `store.storePhone` if available, otherwise falls back to `TWILIO_PHONE_NUMBER` from environment
   - **Email**: Uses `store.notificationEmail` if available, otherwise uses `store.storeEmail`, then falls back to `SMTP_FROM` from environment

### Frontend Changes

1. **Registration Form** (`apps/web/src/app/register/page.tsx`):
   - Added "Store Phone Number" field (optional)
   - Added "Notification Email" field (optional)
   - Both fields have helpful placeholder text and descriptions

2. **API Types Updated**:
   - `RegisterDto` interface includes optional phone and email
   - `Store` interface includes `storePhone` and `notificationEmail`
   - `CreateStoreDto` and `UpdateStoreDto` updated accordingly

3. **Auth Context**: Updated `RegisterData` interface to include new fields

## How It Works

### Registration Flow

1. User fills out registration form including:
   - Owner name
   - Store name
   - Store email (required)
   - Store phone (optional, for SMS)
   - Notification email (optional, defaults to store email)
   - PIN

2. Backend creates:
   - Owner account
   - Store with phone and email
   - First employee (owner role)

3. Store's phone/email are stored and used for all future notifications

### Notification Flow

When a ticket status is updated:

1. System checks if ticket has a customer with phone/email
2. **For SMS**:
   - Uses `store.storePhone` as the "from" number
   - Falls back to `TWILIO_PHONE_NUMBER` if store phone not set
   - Requires Twilio account configured (shared across all stores)

2. **For Email**:
   - Uses `store.notificationEmail` as the "from" address
   - Falls back to `store.storeEmail` if notification email not set
   - Falls back to `SMTP_FROM` if neither is available
   - Uses SMTP server configured in environment variables

## Important Notes

### SMS (Twilio)

- **Shared Twilio Account**: All stores use the same Twilio account credentials (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`)
- **Store Phone Number**: The `store.storePhone` is used as the "from" number, but it must be a valid Twilio phone number in your account
- **Phone Number Format**: Must be in E.164 format (e.g., `+1234567890`)
- **If store phone not set**: Falls back to the default `TWILIO_PHONE_NUMBER` from environment

### Email (SMTP)

- **Shared SMTP Server**: All stores use the same SMTP server configured in environment variables
- **Store Email as Sender**: Each store can use their own email as the "from" address
- **SMTP Authentication**: Uses the SMTP credentials from environment variables for authentication
- **Reply-To**: Consider setting up reply-to addresses if you want customers to reply to store emails

## Configuration

### Environment Variables (Still Required)

```env
# Twilio (shared across all stores)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890  # Default fallback number

# SMTP (shared across all stores)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-smtp-user@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com  # Default fallback email
```

### Store-Level Configuration

Each store can set:
- `storePhone`: Their phone number for SMS (must be a Twilio number)
- `notificationEmail`: Their email for notifications (can be any email)

## Migration

To apply the database changes:

```bash
cd pos-repair-platform/apps/api
npx prisma migrate deploy
# or for development:
npx prisma migrate dev
```

## Testing

1. **Register a new store** with phone and email
2. **Create a ticket** with a customer that has phone/email
3. **Update ticket status** - customer should receive notification from store's phone/email
4. **Check logs** to verify which sender was used

## Future Enhancements

Consider adding:
- Per-store Twilio account support (if stores want their own accounts)
- Email template customization per store
- SMS/Email preferences per customer
- Notification history/logging
- Store settings page to update phone/email after registration



