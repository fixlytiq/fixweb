# Post-Repair Form Troubleshooting

## When the Form Should Appear

The post-repair form appears automatically when a ticket status is:
- **READY** - Repair complete, ready for customer pickup
- **COMPLETED** - Ticket fully completed and closed

## Troubleshooting Steps

### 1. Hard Refresh Your Browser

The form was just added, so you need to clear your browser cache:

- **Windows/Linux**: Press `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: Press `Cmd + Shift + R`
- Or open Developer Tools (F12) → Right-click refresh button → "Empty Cache and Hard Reload"

### 2. Check Ticket Status

1. Open a ticket detail page
2. Look at the status badge at the top
3. The status must be exactly **"READY"** or **"COMPLETED"** (case-sensitive)
4. If it's "IN_PROGRESS" or "AWAITING_PARTS", change it to "READY" or "COMPLETED"

### 3. Check Browser Console

1. Open Developer Tools (F12)
2. Go to the Console tab
3. Look for any red error messages
4. Check if you see: `Ticket status: COMPLETED Is COMPLETED: true`

### 4. Verify the Form Location

The form should appear:
- In the main content area (left column on desktop)
- **Above** the "Notes" section
- **Below** the "Timeline" section

### 5. Test Steps

1. Navigate to: http://localhost:3001/tickets
2. Click on any ticket
3. Change the status to "READY" or "COMPLETED" using the status updater in the sidebar
4. The form should appear immediately in the main content area

### 6. If Still Not Showing

Check the browser console and look for:
- Import errors
- Component errors
- Status value (should be "COMPLETED" or "READY")

## Quick Test

1. Go to a ticket detail page
2. Open browser console (F12)
3. Type: `document.querySelector('[data-testid="post-repair-form"]')` 
4. Or check the page source for "Post-Repair Form"

## Expected Behavior

When status is READY or COMPLETED:
- ✅ Form appears automatically
- ✅ Shows device condition dropdown
- ✅ Shows customer satisfaction rating
- ✅ Shows warranty information section
- ✅ Shows follow-up section
- ✅ Shows additional notes field
- ✅ Submit button at the bottom

When status is NOT READY or COMPLETED:
- ❌ Form does not appear (this is expected)

## Still Not Working?

1. Check Docker logs: `docker-compose logs web | tail -50`
2. Verify the component file exists: `ls apps/web/src/components/post-repair-form.tsx`
3. Check the import in the ticket page
4. Try accessing a ticket with status "COMPLETED" directly

