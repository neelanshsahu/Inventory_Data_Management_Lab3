const express = require("express");
const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

// POST /api/products - create a product.
router.post("/", asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
}));

// GET /api/products/low-stock - products at or below their reorder level.
router.get("/low-stock", asyncHandler(async (req, res) => {
  const lowStockItems = await Product.find({
    $expr: { $lte: ["$quantity", "$reorderLevel"] }
  }).sort({ quantity: 1 });

  res.json({ count: lowStockItems.length, lowStockItems });
}));

// GET /api/products/summary - category-wise inventory aggregation.
router.get("/summary", asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalStockValue: { $sum: { $multiply: ["$price", "$quantity"] } },
        avgPrice: { $avg: "$price" }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        category: "$_id",
        totalItems: 1,
        totalQuantity: 1,
        totalStockValue: { $round: ["$totalStockValue", 2] },
        avgPrice: { $round: ["$avgPrice", 2] }
      }
    }
  ]);

  res.json({ categories: summary.length, summary });
}));

// GET /api/products - filtering, sorting and pagination.
router.get("/", asyncHandler(async (req, res) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    sort = "createdAt",
    order = "desc",
    page = 1,
    limit = 10
  } = req.query;

  const filter = {};

  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
  if (search) filter.name = { $regex: escapeRegex(search), $options: "i" };

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    if (Object.values(filter.price).some(Number.isNaN)) {
      return res.status(400).json({ message: "minPrice and maxPrice must be numbers" });
    }
  }

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const allowedSort = ["name", "price", "quantity", "createdAt", "category"];
  const sortField = allowedSort.includes(sort) ? sort : "createdAt";
  const sortOrder = order.toLowerCase() === "asc" ? 1 : -1;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize),
    Product.countDocuments(filter)
  ]);

  res.json({
    total,
    page: pageNumber,
    totalPages: Math.ceil(total / pageSize),
    count: products.length,
    products
  });
}));

// GET /api/products/:id - get one product.
router.get("/:id", asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
}));

// PUT /api/products/:id - update product details.
router.put("/:id", asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
}));

// PATCH /api/products/:id/stock - safely adjust stock quantity.
router.patch("/:id/stock", asyncHandler(async (req, res) => {
  const change = Number(req.body.change);

  if (!Number.isInteger(change) || change === 0) {
    return res.status(400).json({ message: "change must be a non-zero integer" });
  }

  // Atomic update prevents two simultaneous stock changes overwriting each other.
  const product = await Product.findOneAndUpdate(
    {
      _id: req.params.id,
      ...(change < 0 ? { quantity: { $gte: Math.abs(change) } } : {})
    },
    { $inc: { quantity: change } },
    { new: true, runValidators: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) return res.status(404).json({ message: "Product not found" });
    return res.status(400).json({ message: "Insufficient stock for this sale" });
  }

  res.json({ message: "Stock updated", product });
}));

// DELETE /api/products/:id - delete product.
router.delete("/:id", asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  res.json({ message: "Product deleted", id: product._id });
}));

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = router;
