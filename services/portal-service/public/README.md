# public/ — where portal-web's build output goes

`PORTAL_DIST_PATH` points here by default. It used to default to
`../apps/portal/dist`, which meant something because the backend and the frontend
shared a workspace; this service does not, so the path became explicit.

**What is here now is a stand-in, not a build.** It is `apps/portal/index.html`
from the monorepo — the source template, with the `<!-- speckit:meta:start -->` /
`<!-- speckit:meta:end -->` markers `PortalHtmlController` replaces at serve time,
but without the bundled JavaScript and CSS a real `vite build` produces. It is
enough to exercise the metadata injection and not enough to render the site.

Replace it with the real thing:

```bash
pnpm --filter portal-web build     # in the monorepo
cp -r apps/portal/dist/* <this>/public/
```

or point `PORTAL_DIST_PATH` at that `dist` directory instead of copying.

Two things about those markers are load-bearing:

- **Keep them.** Everything between them is replaced per request with values from
  `GetPageMetaUseCase`. WhatsApp and Facebook crawlers do not execute JavaScript,
  so without this every article on the site shares one identical share card.
- **Keep the tags between them as a sensible default.** A path that resolves to
  nothing public falls back to them rather than 404ing — a broken share card is a
  worse outcome than a generic one, and an HTTP 404 with no HTML would replace the
  site's own not-found page with the server's.
