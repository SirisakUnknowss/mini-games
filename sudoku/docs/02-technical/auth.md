# 🔐 Authentication

> Auth strategy ใช้ Supabase Auth

## 🎯 Goals

1. Low friction — ให้เล่นก่อนสมัคร (anonymous user)
2. Multi-method — email + Google + Apple
3. Cross-device sync — login จากอุปกรณ์อื่นได้

---

## 🔑 Methods Supported

### Anonymous (Default)
- ครั้งแรกที่เปิดแอป → auto-create anonymous user
- User มี `auth.users.id` (UUID) แต่ไม่มี email
- ใช้งานได้ทุกอย่างยกเว้น cross-device sync
- เก็บ session token ใน localStorage
- ขึ้น leaderboard ในชื่อ `Anonymous_xxxx`

```ts
const { data, error } = await supabase.auth.signInAnonymously();
```

### Email + Password
- Supabase native
- Email verification required
- Reset via magic link

```ts
await supabase.auth.signUp({ email, password });
await supabase.auth.signInWithPassword({ email, password });
```

### Google OAuth
- Supabase OAuth provider
- ใช้กับ web + mobile (Capacitor Google Sign-In)

```ts
await supabase.auth.signInWithOAuth({ provider: 'google' });
```

### Apple OAuth (iOS only)
- Required for App Store ถ้ามี OAuth อื่น

### Magic Link (passwordless)
- Backup option

---

## 🔄 Anonymous → Permanent Account

ผู้เล่นใช้แบบ anonymous → อยากเซฟข้าม device → upgrade

```ts
// Link email to anonymous user
await supabase.auth.updateUser({
  email: 'user@example.com',
  password: '...'
});

// แล้ว profile.is_anonymous = false
```

**Server hook:**
```sql
CREATE OR REPLACE FUNCTION on_anonymous_upgrade()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_anonymous = true AND NEW.is_anonymous = false THEN
    UPDATE profiles SET is_anonymous = false WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🚪 Sign Out

```ts
await supabase.auth.signOut();
```

- Clear local session
- ห้ามลบ user data (อาจ login กลับมา)

---

## 🗑️ Account Deletion

ตาม GDPR ต้องมี option ลบ account ถาวร

```ts
// Edge function: delete-account
async function deleteAccount(userId: string) {
  // Cascade delete via FK on auth.users.id
  await supabase.auth.admin.deleteUser(userId);
}
```

---

## 🛡️ Security

### JWT
- HS256 by default (Supabase)
- 1-hour expiry
- Auto-refresh via SDK

### Password Policy
- Min 8 chars
- Configured ใน Supabase dashboard

### Rate Limiting
- Supabase auth: 30 req/hour/IP
- Sign-up: 4 req/hour/IP

### Session Storage
- Web: localStorage (default)
- Capacitor: Secure storage plugin

---

## 🚦 Auth Flow Diagrams

### First-time Open
```
App start
  → Check localStorage for session
  → Not found
  → signInAnonymously()
  → Create profile + wallet + progression (trigger)
  → Save session
  → Enter app
```

### Returning User
```
App start
  → Check localStorage for session
  → Found
  → Validate (auto-refresh JWT)
  → Enter app
```

### Sign Up with Email
```
User clicks "Create account"
  → Show form
  → submit
  → updateUser({ email, password }) [if anonymous]
  → Or signUp({ email, password }) [if new]
  → Send verification email
  → User clicks link
  → confirmed = true
```

---

## 🧪 Testing

```ts
describe('auth', () => {
  it('creates profile on signup', async () => {
    const { user } = await supabase.auth.signUp({ ... });
    const { data: profile } = await supabase
      .from('profiles')
      .select()
      .eq('id', user.id)
      .single();
    expect(profile).toBeDefined();
  });

  it('anonymous user can play', async () => {
    const { user } = await supabase.auth.signInAnonymously();
    expect(user.is_anonymous).toBe(true);
    // Submit a score, should work
  });
});
```

---

## ⚠️ Edge Cases

### Anonymous → user clears storage
- Lose access to data
- Show warning: "เล่นแบบ guest จะหายถ้าเคลียร์ข้อมูล — สมัครเพื่อเซฟ"

### User เปลี่ยน device
- Anonymous: ข้อมูลหาย
- Email/OAuth: login กลับเข้ามาได้

### Email conflict
- ถ้า email มีคนใช้แล้ว → error
- Suggest "forgot password?"

### Multiple anonymous accounts
- ทุก device ที่ install ใหม่จะมี anonymous account ใหม่
- เป็นเรื่องปกติ
