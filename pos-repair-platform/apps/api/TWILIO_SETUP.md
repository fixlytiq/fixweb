# Twilio SMS and Email Notifications Setup

This document explains how to configure Twilio SMS and email notifications for repair ticket status updates.

## Features

- **SMS Notifications**: Automatically sends SMS messages to customers when ticket status changes
- **Email Notifications**: Sends HTML email notifications to customers when ticket status changes
- **Status Updates**: Notifications are sent for all status changes (RECEIVED, IN_PROGRESS, AWAITING_PARTS, READY, COMPLETED, CANCELLED)

## Prerequisites

1. **Twilio Account**: Sign up at [https://www.twilio.com](https://www.twilio.com)
2. **Email Service**: Choose one of the following:
   - SMTP server (Gmail, Outlook, custom SMTP)
   - Twilio SendGrid (recommended for production)

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file or Docker Compose configuration:

#### Twilio SMS Configuration

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number (E.164 format)
```

#### SMTP Email Configuration

```env
SMTP_HOST=smtp.gmail.com  # or your SMTP server
SMTP_PORT=587  # or 465 for SSL
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourstore.com  # Optional: sender email address
```

### Getting Twilio Credentials

1. Log in to your [Twilio Console](https://console.twilio.com)
2. Navigate to **Account** → **Account Info**
3. Copy your **Account SID** and **Auth Token**
4. Get a phone number from **Phone Numbers** → **Manage** → **Buy a Number**

### Email Setup Examples

#### Gmail Setup

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use these settings:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   SMTP_FROM=your-email@gmail.com
   ```

#### Outlook/Hotmail Setup

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_FROM=your-email@outlook.com
```

#### Custom SMTP Server

```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yourdomain.com
```

## Docker Compose Configuration

The `docker-compose.yml` file already includes these environment variables. You can set them in:

1. A `.env` file in the `pos-repair-platform` directory
2. Directly in the `docker-compose.yml` file
3. As environment variables when running `docker-compose up`

Example `.env` file:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=pos_repair_platform

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourstore.com
```

## How It Works

1. When a ticket status is updated via the API, the system automatically:
   - Checks if the ticket has a customer with phone/email
   - Sends SMS notification if phone number is available
   - Sends email notification if email address is available
   - Logs success/failure (notifications don't block the update)

2. Notification messages include:
   - Customer name
   - Ticket title and ID
   - Current status
   - Store name
   - Cost information (if available)
   - Any additional notes

## Testing

### Test SMS Notification

1. Create or update a ticket with a customer that has a phone number
2. Change the ticket status
3. Check the API logs for SMS delivery confirmation
4. The customer should receive an SMS message

### Test Email Notification

1. Create or update a ticket with a customer that has an email address
2. Change the ticket status
3. Check the API logs for email delivery confirmation
4. The customer should receive an email

## Troubleshooting

### SMS Not Working

- Verify Twilio credentials are correct
- Check that the phone number is in E.164 format (+1234567890)
- Ensure your Twilio account has sufficient balance
- Check API logs for error messages

### Email Not Working

- Verify SMTP credentials are correct
- For Gmail, ensure you're using an App Password, not your regular password
- Check firewall settings if using custom SMTP
- Verify SMTP port (587 for TLS, 465 for SSL)
- Check API logs for error messages

### Notifications Not Sending

- Ensure customer has phone number or email in the database
- Check that ticket has a customer assigned
- Review API logs for notification service errors
- Verify environment variables are set correctly

## Security Notes

- Never commit `.env` files or credentials to version control
- Use environment variables or secrets management in production
- Rotate Twilio auth tokens regularly
- Use App Passwords for email services when available

## Cost Considerations

- **Twilio SMS**: Charges per message sent (check Twilio pricing)
- **Email**: Usually free with SMTP providers, but check rate limits
- Consider implementing rate limiting for high-volume stores

