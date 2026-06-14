# Google OAuth Setup Guide for Cortex AI

This guide walks through configuring Google OAuth for Supabase authentication in the Cortex AI project.

---

## Prerequisites

- A Supabase project (with the project URL and anon key already in `.env.local`)
- A Google Cloud account

---

## Step 1: Create a Google Cloud OAuth Client

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services → Credentials**
4. Click **+ Create Credentials → OAuth client ID**
5. If prompted, configure the **OAuth consent screen** first:
   - Choose **External** user type (unless you have a Google Workspace org)
   - Fill in the required fields:
     - **App name**: `Cortex AI`
     - **User support email**: your email
     - **Developer contact email**: your email
   - Add scopes: `email`, `profile`, `openid`
   - Save and continue through the remaining screens
6. Back on the **Credentials** page, click **+ Create Credentials → OAuth client ID**
7. Select **Web application** as the application type
8. Set the **Name** to `Cortex AI - Supabase`
9. Under **Authorized redirect URIs**, add:
   ```
   https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback
   ```
   > Replace `<YOUR-SUPABASE-PROJECT-REF>` with your Supabase project reference ID.
   > You can find this in your Supabase project URL: `https://YOUR-REF.supabase.co`
10. Click **Create**
11. Copy the **Client ID** and **Client Secret** — you'll need these in Step 2

---

## Step 2: Configure Google Provider in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication → Providers**
4. Find **Google** in the provider list and click to expand
5. Toggle **Enable Google provider** to ON
6. Paste the **Client ID** and **Client Secret** from Step 1
7. The **Authorized Client IDs** field can be left empty for web-only auth
8. Click **Save**

---

## Step 3: Verify the Callback URL

The Supabase callback URL must match exactly what you entered in Google Cloud Console.

- **Supabase callback URL format**: `https://<YOUR-REF>.supabase.co/auth/v1/callback`
- **Your app's callback URL** (already configured in the codebase): `/auth/callback`

The flow is:
1. User clicks "Continue with Google"
2. Redirected to Google's consent screen
3. Google redirects to `https://<YOUR-REF>.supabase.co/auth/v1/callback`
4. Supabase processes the OAuth token
5. Supabase redirects to your app's `/auth/callback` route
6. Your app exchanges the code for a session
7. User is redirected to `/dashboard`

---

## Step 4: Update Environment Variables

Make sure your `.env.local` has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<YOUR-REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

> The Google OAuth credentials live in the Supabase Dashboard, NOT in your `.env.local`.
> Your app never directly communicates with Google — Supabase handles the OAuth exchange.

---

## Step 5: Configure Supabase Auth Settings

1. In the Supabase Dashboard, go to **Authentication → URL Configuration**
2. Set **Site URL** to your app's URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-production-domain.com`
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://your-production-domain.com/auth/callback` (for production)

---

## Step 6: (Development) Disable Email Confirmation (Optional)

For faster development iteration, you can disable email confirmation:

1. In the Supabase Dashboard, go to **Authentication → Email**
2. Toggle **Confirm email** to OFF
3. This allows users to sign in immediately after signup without clicking a confirmation link

> **Warning**: Re-enable this before going to production!

---

## Testing

1. Start the dev server: `npm run dev`
2. Visit `http://localhost:3000/login`
3. Click **Continue with Google**
4. You should be redirected to Google's consent screen
5. After granting access, you should land on `/dashboard` with your Google account email displayed

---

## Troubleshooting

| Issue | Solution |
|---|---|
| "redirect_uri_mismatch" error | Verify the redirect URI in Google Cloud Console matches exactly: `https://<YOUR-REF>.supabase.co/auth/v1/callback` |
| Stuck on Google consent screen | Check that the OAuth consent screen is published (not in "Testing" mode) or that your test email is added to the test users list |
| Redirected to `/login?error=auth` | The code exchange failed. Check Supabase logs (Dashboard → Logs → Auth) for details |
| "Email not confirmed" after signup | Disable email confirmation in Supabase Dashboard → Authentication → Email (development only) |
