# SupportME

> "Support without the noise" — A lightweight, embeddable payment widget for creators.

Monorepo containing the core packages for [SupportME](https://github.com/ryuforthepeople/supportme).

## Packages

| Package | Description |
|---------|-------------|
| `@supportme/core` | TypeScript types, Stripe adapter, payment orchestration, fee calculation |
| `@supportme/api` | Hono-based REST API with payment and webhook routes |

## Development

```bash
pnpm install
pnpm build
```

## Architecture

See the [architecture document](https://github.com/ryuforthepeople/supportme/wiki) for full details.

## License

MIT
