# Medimoove Frontend

React PWA — healthcare logistics marketplace

## Setup

```bash
npm install
cp .env.example .env
# Fill in your keys in .env
npm run dev
```

## Environment Variables

```
VITE_API_URL=https://medimoove-backend.onrender.com/api
VITE_MAPBOX_KEY=your_mapbox_public_key
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key
```

`VITE_API_URL` is optional. If it is omitted, or if an old local value such as
`http://localhost:5000/api` is present, the app safely uses the Medimoove Render
backend: `https://medimoove-backend.onrender.com/api`.


## Build

```bash
npm run build
```

## Stack

- React 18 + Vite
- TailwindCSS (Medimoove visual system)
- React Router v6
- Zustand (auth + cart state)
- TanStack React Query (server state)
- Axios (API client)
- Mapbox GL (maps + delivery pin drop)
- React Hot Toast (notifications)
- PWA via vite-plugin-pwa

## Folder Structure

```
src/
├── api/          # One file per backend domain — exact endpoint mapping
├── components/   # Shared UI (Button, Input, Card, Modal, Loader...)
├── features/     # Pages grouped by role (auth/customer/vendor/rider/admin)
├── layouts/      # Shell layouts with bottom nav per role
├── routes/       # ProtectedRoute, RoleRoute, PublicRoute, route tree
├── services/     # mapbox.js
├── store/        # authStore, cartStore, uiStore (Zustand)
├── utils/        # formatNaira, formatDate, status display helpers
├── App.jsx
└── main.jsx
```

## Role Routing

| Role     | Entry path          |
|----------|---------------------|
| Customer | /customer/home      |
| Vendor   | /vendor/dashboard   |
| Rider    | /rider/dashboard    |
| Admin    | /admin/dashboard    |

## Important Notes

- Cart is client-side only (Zustand + sessionStorage)
- JWT stored in sessionStorage, hydrated on load
- Order creation uses POST /api/sub-orders/create only
- All status strings are UPPERCASE (DELIVERED not delivered)
- Reviews use sub_order_id not order_id
- Receipts returned as text/html — open in new tab
- Paystack flow: initialize → redirect → /payment/verify?reference=xxx
