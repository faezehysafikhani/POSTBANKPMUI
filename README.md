# PostbankPM UI

رابط React/Vite سامانه مدیریت پروژه پست بانک. این پروژه مستقل از Backend نگه داشته شده و فقط از طریق HTTP API به پروژه `PostbankPM` متصل می‌شود.

## اجرای محلی

پیش‌نیازها: Node.js و اجرای Backend روی `http://localhost:5151`.

```powershell
npm install
npm run dev
```

Vite روی پورت `3000` اجرا می‌شود و مسیرهای `/api` و `/hubs` را به Backend پراکسی می‌کند. در محیط استقرار، مقدار `VITE_API_BASE_URL` را در `.env.local` برابر آدرس عمومی Backend قرار دهید.

حساب seed محیط توسعه:

- Email: `admin@nexus.local`
- Password: `Admin@12345`
- Tenant slug: `default`

برای فهرست محدودیت‌های قرارداد فعلی Core، فایل [INTEGRATION_GAPS.md](./INTEGRATION_GAPS.md) را ببینید.
