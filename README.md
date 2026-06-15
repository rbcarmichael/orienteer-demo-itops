# IT Ops Auto-Remediation Demo

Live demo of AI-governed IT operations with automatic remediation and human approval gates.

**Pattern:** Disk/memory/failover alert → classify → disk full auto-fix · memory spike auto-restart · database failover requires human approval

**Stack:** Next.js 14 (App Router) · TypeScript · Vercel

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

```bash
npx vercel --prod
```

Or connect the repo in the Vercel dashboard — zero configuration needed.

## API endpoints

- `POST /api/alert` — classify an incoming alert (P1/P2/P3), returns `alertId`, `priority`, `status`, `recommendation`
- `POST /api/approve` — record an approval/rejection for a P1 alert

## n8n workflows (optional)

Import the two workflow JSONs from the `workflows/` folder into your n8n instance if you want to hook live webhooks:

1. `itops_process_alert.json` — main webhook workflow
2. `itops_approve_action.json` — approval webhook workflow

---

Built by [Orienteer AI](https://orienteer.ai) · [See all demos](https://orienteer.ai/demos)
