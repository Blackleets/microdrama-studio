# Security and release checklist

- [ ] Configure Supabase Auth and restrict Studio routes to authorized owners.
- [ ] Apply SQL migrations and verify RLS using separate owner and non-owner accounts.
- [ ] Keep service-role keys and AI provider keys server-side only.
- [ ] Create private Storage buckets; issue short-lived signed URLs for private assets.
- [ ] Add server-side authorization to every mutation and generation endpoint.
- [ ] Make payment webhooks signature-verified and idempotent.
- [ ] Use a transactional server-side ledger for wallet credit/debit.
- [ ] Prevent episode publication without a valid owner approval.
- [ ] Add moderation, rights, privacy and content takedown workflows.
- [ ] Configure backups, monitoring, error reporting and rate limits.
- [ ] Run typecheck, lint, production build and end-to-end tests before launch.

The current commit is a foundation, not a production-ready service. Do not deploy with real users or payments until the checklist is completed.
