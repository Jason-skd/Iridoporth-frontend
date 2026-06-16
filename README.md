# Iridoporth Frontend

Personal frontend for Iridoporth, built with React, TypeScript, Vite, and a small route layer.

The current visual direction is an aircraft-window notebook: capsule-shaped cabin window, paper texture, route marks, live raspi signal, and flight-log fragments.

## Routes

- `/` - home page and narrative entry
- `/raspi-status` - focused raspi instrument page
- `/flight-log` - writable flight log page

## Development

```sh
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to `http://127.0.0.1:3000` by default, matching the backend development port. Override it when needed:

```sh
VITE_DEV_API_TARGET=http://127.0.0.1:3000 npm run dev
```

## Verification

```sh
npm run lint
npm run build
```

