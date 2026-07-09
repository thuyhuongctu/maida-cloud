# M-AIDA Cloud

SaaS platform for AI-assisted effect-size extraction and meta-analysis data
management, with human verification and immutable data locking. It builds on
the M-AIDA research tool by adding persistent storage, multi-tenant accounts,
metered usage and a hosted web application.

## Stack

- Next.js 14 (App Router) and TypeScript
- PostgreSQL with Prisma
- Authentication with JWT sessions and bcrypt password hashing
- Vendor-neutral language-model adapter (OpenAI-compatible endpoint)
- PDF text extraction with unpdf

## Quick start

```bash
cp .env.example .env
# edit .env with your database URL and your own LLM provider settings
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Open http://localhost:3000.

## Accounts

Create an account at /register. The first account also creates its
organization and a default project. Sign in at /login. The dashboard and the
extraction endpoints require a valid session; sessions are signed with
`AUTH_SECRET` and stored in an http-only cookie.

## Core workflow

1. Sign in, then upload a PDF. The extractor proposes statistics and derives
   Pearson r using Cohen (1988) for t and Peterson and Brown (2005) for beta.
2. Each record is flagged for verification when confidence is below the
   review threshold.
3. A reviewer approves the record, then locks it. Locked records are
   immutable and eligible for the analysis export.

## Billing

Every organization starts on the free plan with a monthly extraction quota.
The plan, quota and usage logic run without any payment keys, so the limit is
enforced in local development. Configure `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET` and the plan price identifiers to enable paid upgrades
through Stripe Checkout. The billing page is at /billing.

## Configuration

The language model is configured through `LLM_BASE_URL`, `LLM_API_KEY` and
`LLM_MODEL`. The application does not depend on any single provider.

## Authors

Do Thuy Huong and Phan Anh Tu, School of Economics, Can Tho University.

## License

Proprietary. All rights reserved. Commercial use requires a license from the
copyright holders.
