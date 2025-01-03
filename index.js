const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require('express-rate-limit'); // Import the rate-limit library

dotenv.config();
console.log(process.env);

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

// Apply rate limiting to the /payment/create endpoint
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit to 100 requests per windowMs
});

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "success!",
    total: req.query,
  });
});

app.post("/payment/create", limiter, async (req, res) => { // Apply limiter to this route
  console.log("request received");

  const total = req.query.total;
  if (total > 0) {
    try {
      // Validate total amount (e.g., check if it's a number and non-negative)
      if (isNaN(total) || total < 0) {
        throw new Error("Invalid total amount");
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: "usd",
      });

      console.log("Payment Intent created successfully:", paymentIntent.id); 

      res.status(201).json({
        client_secret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(400).json({ error: error.message || "Bad Request" });
    }
  } else {
    res.status(400).json({ error: "Total amount must be greater than zero" });
  }
});

app.listen(5000, (err) => {
  if (err) throw err;
  console.log("amazon server running on PORT: 5000, http://localhost:5000");
});