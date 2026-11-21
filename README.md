# SAI RAM TRADERS — Supplier Material Order

Inventory and supplier material-list application built with React, Express, MongoDB, and Mongoose.

## Local development

1. Install dependencies:
   ```bash
   npm install --prefix client
   npm install --prefix server
   ```
2. Create `server/.env`:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   ```
3. Start the API:
   ```bash
   npm run dev --prefix server
   ```
4. Start the client:
   ```bash
   npm run dev --prefix client
   ```

## Vercel deployment

- Frontend: `https://srt-material-supplychain.vercel.app`
- Backend: `https://best-supplier-material-order.vercel.app`

The backend root responds with API status, and `/api/health` reports database connectivity. The frontend uses `VITE_API_URL` from `client/.env.production`; the backend CORS allowlist accepts the frontend domain for browser API requests.
