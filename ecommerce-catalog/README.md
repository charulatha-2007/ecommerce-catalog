# Ledger — E-Commerce Product Catalog

A scalable product catalog built as two independently deployable services:
a **Node.js/Express/MongoDB REST API** and a **React (Vite) frontend** that
consumes it. Designed as a reference for backend architecture that scales:
indexed queries, pagination, a modular service layer, and validated/sanitized
input at every boundary.

```
ecommerce-catalog/
├── backend/           Express API (Node.js + MongoDB/Mongoose)
└── frontend/          React SPA (Vite)
```

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env      # edit MONGO_URI if not using local default
npm install
npm run seed               # populates sample categories + products
npm run dev                 # starts on http://localhost:5000
```

Requires a running MongoDB instance (local, Docker, or Atlas) reachable at
the `MONGO_URI` in `.env`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:5000`
(see `vite.config.js`), so no CORS configuration is needed locally.

## Architecture

### Backend — layered & modular

```
src/
├── config/db.js            Mongo connection (pooled)
├── models/                 Mongoose schemas + indexes
│   ├── Product.js
│   └── Category.js
├── middleware/
│   ├── validate.js         express-validator rule chains
│   ├── sanitize.js         XSS stripping (+ mongo-sanitize in app.js)
│   └── errorHandler.js     Centralized error formatting
├── services/                Business logic, DB access — framework-agnostic
│   ├── productService.js
│   └── categoryService.js
├── controllers/             Thin HTTP layer: parse request -> call service -> respond
├── routes/                   Route definitions + validation wiring
├── utils/
│   ├── apiFeatures.js       Search/filter/sort/pagination query builder
│   └── seed.js              Sample data generator
└── app.js                    Express app assembly (security, routes, errors)
```

This separation (routes → controllers → services → models) means business
logic is testable without spinning up HTTP, and any layer can be swapped
(e.g. add GraphQL alongside REST) without touching the others.

### Data modeling

- **Category**: supports an optional `parent` reference, so the catalog can
  express a hierarchy (Electronics → Laptops → Gaming Laptops) without a
  schema change, and lists top-level or child categories on demand.
- **Product**: references `category` by ObjectId; carries a flexible
  `attributes` map for category-specific specs (color, size, wattage, etc.)
  without needing per-category collections.

### Indexing strategy (see `models/Product.js`)

| Index | Purpose |
|---|---|
| `{ name, description, brand, tags: 'text' }` (weighted) | Free-text search via `$text`, ranked by relevance |
| `{ category: 1, price: 1 }` | Category browse + price filter/sort — the most common storefront query |
| `{ category: 1, createdAt: -1 }` | Category browse with "newest first" default sort |
| `{ price: 1 }` | Standalone price range queries |
| `{ isActive: 1, stock: 1 }` | "In stock only" storefront filter |
| `sku` (unique) | Catalog integrity + O(log n) lookup |

Explain-plan these against your dataset size before production; index choice
should follow observed query patterns, not just this starting set.

### Pagination

`GET /api/v1/products` uses `skip`/`limit` bounded server-side (`limit` capped
at 100) with `page`, `total`, `totalPages`, `hasNextPage`, `hasPrevPage`
returned alongside results — the frontend never has to compute pagination
math itself. For very deep pagination on large collections, consider
switching to cursor-based (`_id`-anchored) pagination; the `ApiFeatures`
builder is isolated specifically so that swap is contained to one file.

### Validation & sanitization

- **express-validator** rule chains per route (`middleware/validate.js`)
  reject malformed input (bad types, out-of-range values, invalid ObjectIds)
  with a 422 and field-level error messages before it reaches a controller.
- **express-mongo-sanitize** strips NoSQL operator injection (`$gt`, `$where`, …).
- **xss** strips script/HTML payloads from strings in body/query/params.
- **Mongoose schema validation** is a second line of defense (required
  fields, min/max, custom validators like "discount ≤ price").

### Security & ops middleware

`helmet` (secure headers), `cors` (origin allowlist via `CLIENT_ORIGIN`),
`express-rate-limit` (per-IP request caps), `compression`, and structured
error responses with stack traces only in development.

## REST API reference

Base URL: `/api/v1`

### Products

| Method | Path | Description |
|---|---|---|
| GET | `/products` | List products. Query: `search, category, brand, minPrice, maxPrice, inStock, tags, sort, page, limit` |
| GET | `/products/facets?category=` | Distinct brands + price bounds, for building filter UI |
| GET | `/products/:id` | Get one product |
| POST | `/products` | Create a product |
| PATCH | `/products/:id` | Update a product |
| DELETE | `/products/:id` | Soft-delete (deactivate) a product |

`sort` accepts: `priceAsc`, `priceDesc`, `newest`, `oldest`, `rating`, `relevance` (relevance requires `search`).

**Example**

```
GET /api/v1/products?search=headphones&category=64f...&minPrice=20&maxPrice=100&sort=priceAsc&page=2&limit=12
```

```json
{
  "success": true,
  "data": [ { "_id": "...", "name": "Voltix Wireless Earbuds 3", "price": 59.99, "...": "..." } ],
  "pagination": { "page": 2, "limit": 12, "total": 34, "totalPages": 3, "hasNextPage": true, "hasPrevPage": true }
}
```

### Categories

| Method | Path | Description |
|---|---|---|
| GET | `/categories?parent=root` | List top-level categories |
| GET | `/categories?parent=<id>` | List children of a category |
| GET | `/categories/:id` | Get one category |
| POST | `/categories` | Create a category |
| PATCH | `/categories/:id` | Update a category |
| DELETE | `/categories/:id` | Soft-delete (blocked if active products reference it) |

All error responses share a consistent shape:

```json
{ "success": false, "message": "Validation failed", "errors": [{ "field": "price", "message": "price must be a non-negative number" }] }
```

## Frontend

React SPA (no router needed for a single catalog view) with:

- `api/` — thin axios wrapper per resource (`products.js`, `categories.js`)
- `components/` — `SearchBar`, `FilterSidebar`, `ProductGrid`, `ProductCard`, `Pagination`
- `pages/Catalog.jsx` — owns filter/sort/page state, re-fetches from the API on change

All search, filtering, sorting, and pagination happen server-side — the
frontend never fetches more than one page of results, which is what lets the
catalog scale to a large product count without shipping the whole dataset to
the browser.

## Scaling this further

- Swap `skip/limit` for cursor pagination on very large collections.
- Add Redis in front of `GET /products` and `/facets` for hot category pages.
- Move image storage to S3/CDN; store only URLs (already modeled that way).
- Split `productService` into its own microservice behind the same REST
  contract once catalog write volume outgrows a monolith.
- Add integration tests (e.g. Jest + Supertest) against the service layer,
  which was kept framework-agnostic specifically to make this easy.
