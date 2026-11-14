# Assignment 3: Inventory and Data Management System
**Course:** Web Dev III | **Unit:** 3 | **CO:** CO3

A RESTful inventory backend built with Node.js, Express.js, MongoDB and Mongoose. It supports product validation, CRUD, filtering, sorting, pagination, stock adjustments, low-stock reports and category-wise aggregation.

## 1. Requirements
- Node.js 18+
- MongoDB local service or MongoDB Atlas connection
- Postman

## 2. Setup
```bash
npm install
```

Copy `.env.example` to `.env` and configure:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/inventory_db
```

Start MongoDB, then run:
```bash
npm run dev
```
Server: `http://localhost:5000`

## 3. API endpoints

All request bodies use **Postman → Body → raw → JSON**.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/products` | Create product |
| GET | `/api/products` | List, filter, sort and paginate |
| GET | `/api/products/:id` | Get one product |
| PUT | `/api/products/:id` | Update product details |
| PATCH | `/api/products/:id/stock` | Increase/decrease stock |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/products/low-stock` | Low-stock report |
| GET | `/api/products/summary` | Category-wise aggregation |

## 4. Postman examples

### A. Create product
`POST http://localhost:5000/api/products`
```json
{
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 120,
  "quantity": 48,
  "reorderLevel": 20,
  "supplier": "Cello Pens"
}
```
Expected: `201 Created`. SKU must be unique.

### B. Get all products
`GET http://localhost:5000/api/products`

### C. Filter, sort and paginate
`GET http://localhost:5000/api/products?category=Stationery&minPrice=50&maxPrice=500&sort=price&order=asc&page=1&limit=5`

Supported query parameters:
- `category`: exact category match (case-insensitive)
- `search`: search product name
- `minPrice`, `maxPrice`: price range
- `sort`: `name`, `price`, `quantity`, `createdAt`, or `category`
- `order`: `asc` or `desc`
- `page`, `limit`: pagination (maximum limit 100)

### D. Get one product
`GET http://localhost:5000/api/products/PRODUCT_ID`

### E. Update product
`PUT http://localhost:5000/api/products/PRODUCT_ID`
```json
{
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 140,
  "quantity": 60,
  "reorderLevel": 20,
  "supplier": "Cello Pens"
}
```

### F. Adjust stock
`PATCH http://localhost:5000/api/products/PRODUCT_ID/stock`
```json
{
  "change": 10
}
```
Positive value restocks; negative value records a sale. A sale that would make stock negative is rejected.

### G. Delete product
`DELETE http://localhost:5000/api/products/PRODUCT_ID`

### H. Low-stock report
`GET http://localhost:5000/api/products/low-stock`

Returns products where `quantity` is less than or equal to `reorderLevel`.

### I. Category summary
`GET http://localhost:5000/api/products/summary`

Uses MongoDB aggregation `$group`, `$sum`, `$avg`, `$multiply`, `$sort` and `$project` to calculate item count, total quantity, total stock value and average price per category.

## 5. Product schema validation
- `name`: required, trimmed, minimum 2 characters
- `sku`: required and unique
- `category`: required
- `price`: required, number, minimum 0
- `quantity`: required, non-negative integer
- `reorderLevel`: non-negative number, default 10
- `supplier`: required

Timestamps (`createdAt`, `updatedAt`) are added automatically by Mongoose.

## 6. Folder structure
```text
inventory-data-management-lab3/
├── config/
│   └── db.js
├── middleware/
│   ├── asyncHandler.js
│   └── errorHandler.js
├── models/
│   └── Product.js
├── routes/
│   └── productRoutes.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## 7. Concepts demonstrated
Mongoose schema design, field-level validation, Express RESTful CRUD, query parameters, filtering, sorting, pagination, MongoDB aggregation pipelines, stock adjustment, middleware, centralized error handling and dotenv.

## 8. Conclusion
The Inventory and Data Management System provides a database-driven backend for managing products and stock. It demonstrates validated Mongoose models, complete CRUD APIs, flexible catalogue queries, safe stock changes, low-stock alerts and category-wise inventory reports using aggregation.
