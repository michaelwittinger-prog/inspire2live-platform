# Remove Supabase Email Rate Limit — Custom SMTP Setup

## Why this is needed

Supabase's free tier limits auth emails to **~2–3 per hour per project** (magic links,
password resets, confirm-account emails). Once exceeded you see:

> `email rate limit exceeded`

This is a **Supabase dashboard setting** — it cannot be changed in code. The fix is to
connect your own SMTP provider, which has no rate limit.

---

## Recommended provider: Resend (free, easy, 100 emails/day free tier)

### Step 1 — Create a Resend account

1. Go to **[https://resend.com](https://resend.com)** and sign up (free).
2. Verify your sending domain (or use `onboarding@resend.dev` for testing).
3. Go to **API Keys** → **Create API Key** → copy the key.

### Step 2 — Configure SMTP in Supabase

1. Open your project in the **Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **Authentication** → **Providers** → scroll down to **SMTP Settings**
3. Toggle **Enable Custom SMTP** → ON
4. Fill in:

| Field         | Value                                      |
|---------------|--------------------------------------------|
| Host          | `smtp.resend.com`                          |
| Port          | `465`                                      |
| Username      | `resend`                                   |
| Password      | *(your Resend API key)*                    |
| Sender name   | `Inspire2Live Platform`                    |
| Sender email  | `noreply@yourdomain.com` *(or verified address)* |

5. Click **Save**.

### Step 3 — Remove the rate limit cap

Still in the Supabase Dashboard:

1. Go to **Authentication** → **Rate Limits**
2. Set **"Email rate limit"** to `0` (= unlimited)
3. Click **Save**.

> ⚠️ Keep **SMS rate limits** in place — only remove the email one.

---

## Alternative providers

| Provider     | Free tier      | Notes                          |
|--------------|---------------|--------------------------------|
| **Resend**   | 100/day        | Easiest to set up              |
| **SendGrid** | 100/day        | More features, more complex    |
| **Mailgun**  | 100/day (trial)| Good deliverability            |
| **AWS SES**  | 62,000/month   | Cheapest at scale, harder setup|

---

## Password saving in browsers

The login form already has the correct HTML attributes for browsers to offer
"Save password":

- `name="email"` + `autoComplete="username email"` on email inputs
- `name="password"` + `autoComplete="current-password"` on sign-in password input
- `name="password"` + `autoComplete="new-password"` on sign-up password input

**To trigger browser password save:** Sign in once with email + password via the
"Sign in" tab (not magic link). The browser will prompt to save after a successful login.

---

## The red terminal text

```
To https://github.com/michaelwittinger-prog/inspire2live-platform.git
   1887e2d..faddbc7  main -> main
```

This is **not an error**. Git outputs push progress to `stderr` (standard error stream)
by convention — terminals display `stderr` in red. If the push succeeded (no "rejected"
or "error:" lines), everything is fine. ✅
