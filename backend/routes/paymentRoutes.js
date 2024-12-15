const express = require("express");
const {
  createOrder,
  verifyPayment,
  razorpayApiKey,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);
router.get("/processkey", razorpayApiKey);

module.exports = router;
