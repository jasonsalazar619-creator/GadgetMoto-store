<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## GadgetMoTo development rules

- Work in small, testable checkpoints.
- Do not proceed beyond the requested checkpoint.
- Use strict TypeScript.
- Prefer Server Components unless browser interactivity requires a Client Component.
- Keep components small, accessible, responsive, and reusable.
- Do not install packages unless the current checkpoint requires them.
- Do not invent product specifications, ratings, stock quantities, installment amounts, tax rates, warranties, or store policies.
- Never expose credentials or secrets.
- Never determine successful payment only from a browser redirect.
- Run lint and a production build before completing every coding checkpoint.
