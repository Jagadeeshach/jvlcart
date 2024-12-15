import React from "react";
import axios from "axios";

const PaymentComponent = () => {
  const handlePayment = async () => {
    try {
      // Step 1: Create an order on the backend
      const { data: orderResponse } = await axios.post("/api/v1/create-order", {
        amount: 2, // Amount in paise (₹500)
        currency: "INR",
      });

      if (!orderResponse.success) {
        alert("Failed to create order. Please try again.");
        return;
      }

      // Step 2: Fetch Razorpay key from the backend
      const { data: keyResponse } = await axios.get("/api/v1/processkey");
      const razorpayKey = keyResponse.key;

      // Step 3: Initialize Razorpay payment
      const options = {
        key: razorpayKey, // Use Razorpay key from backend
        amount: orderResponse.order.amount, // Amount in paise
        currency: orderResponse.order.currency,
        name: "Your Business Name",
        description: "Test Transaction",
        order_id: orderResponse.order.id, // Order ID from backend
        handler: async function (response) {
          // Step 4: Verify payment on the backend
          const { data: verifyResponse } = await axios.post(
            "/api/v1/verify-payment",
            {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }
          );

          if (verifyResponse.success) {
            alert("Payment successful and verified!");
          } else {
            alert("Payment verification failed.");
          }
        },
        prefill: {
          name: "Customer Name",
          email: "customer@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#3399cc",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Unable to process payment. Please try again.");
    }
  };

  return <button onClick={handlePayment}>Pay 1</button>;
};

export default PaymentComponent;
