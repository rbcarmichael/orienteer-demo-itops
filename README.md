# IT Ops Auto-Remediation Demo

Live demo of AI-governed IT operations with automatic remediation and human approval gates.

**Pattern:** Disk/memory/failover alert → classify → disk full auto-fix · memory spike auto-restart · database failover requires human approval

**Stack:** n8n · Orienteer AI

**Live demo:** https://rbcarmichael.github.io/orienteer-demo-itops/

## n8n Setup

Import the two workflow JSONs from the `workflows/` folder into your n8n instance:

1. `itops_process_alert.json` — main webhook workflow
2. `itops_approve_action.json` — approval webhook workflow

Both are pre-configured for `fuunji.app.n8n.cloud`. Publish both workflows to activate.

---

Built by [Orienteer AI](https://orienteer.ai) · [See all demos](https://orienteer.ai/demos)
