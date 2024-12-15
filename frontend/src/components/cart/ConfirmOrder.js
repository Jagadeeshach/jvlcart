import React, { Fragment, useEffect } from "react";
import axios from "axios";
import MetaData from "../layouts/MetaData";
import { validateShipping } from "./Shipping";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import CheckoutSteps from "./CheckoutStep";
import { toast } from "react-toastify";
import { orderCompleted } from "../../slices/cartSlice";
import { createOrder } from "../../actions/orderActions";
import { clearError as clearOrderError } from "../../slices/orderSlice";

export default function ConfirmOrder() {
  const { shippingInfo, items: cartItems } = useSelector(
    (state) => state.cartState
  );
  const { user } = useSelector((state) => state.authState);
  const { error: orderError } = useSelector((state) => state.orderState);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const itemsPrice = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shippingPrice = itemsPrice > 200 ? 0 : 1;
  //add shipping price
  let taxPrice = Number(0.05 * itemsPrice);
  const totalPrice = Number(itemsPrice + shippingPrice + taxPrice).toFixed(2);
  taxPrice = Number(taxPrice).toFixed(2);

  const order = {
    orderItems: cartItems,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    shippingInfo,
  };

  const handlePayment = async () => {
    try {
      // Step 1: Create an order on the backend
      const { data: orderResponse } = await axios.post("/api/v1/create-order", {
        amount: totalPrice,
        currency: "INR",
      });

      if (!orderResponse.success) {
        toast("Failed to create order. Please try again.", {
          type: "error",
          position: "bottom-center",
        });
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
        name: "JCodeUniverse",
        description: cartItems.name,
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
            toast("Payment successful and verified!", {
              type: "success",
              position: "bottom-center",
            });
            order.paymentInfo = {
              id: response.razorpay_payment_id,
              status: orderResponse.order.status,
            };
            dispatch(orderCompleted());
            dispatch(createOrder(order));
            navigate("/order/success");
          } else {
            toast("Payment verification failed.", {
              type: "error",
              position: "bottom-center",
            });
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: shippingInfo.phoneNo,
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

  useEffect(() => {
    validateShipping(shippingInfo, navigate);
    if (orderError) {
      toast(orderError, {
        position: "bottom-center",
        type: "error",
        onOpen: () => {
          dispatch(clearOrderError());
        },
      });
      return;
    }
  }, []);

  return (
    <Fragment>
      <MetaData title={"Confirm Order"} />
      <CheckoutSteps shipping confirmOrder />
      <div className="row d-flex justify-content-between">
        <div className="col-12 col-lg-8 mt-5 order-confirm">
          <h4 className="mb-3">Shipping Info</h4>
          <p>
            <b>Name:</b> {user.name}
          </p>
          <p>
            <b>Phone:</b> {shippingInfo.phoneNo}
          </p>
          <p className="mb-4">
            <b>Address:</b> {shippingInfo.address}, {shippingInfo.city},
            {shippingInfo.postalCode}, {shippingInfo.state},
            {shippingInfo.country}
          </p>

          <hr />
          <h4 className="mt-4">Your Cart Items:</h4>
          {cartItems.map((item) => (
            <Fragment>
              <div className="cart-item my-1">
                <div className="row">
                  <div className="col-4 col-lg-2">
                    <img
                      src={item.image}
                      alt={item.name}
                      height="45"
                      width="65"
                    />
                  </div>

                  <div className="col-5 col-lg-6">
                    <Link to={`/product/${item.product}`}>{item.name}</Link>
                  </div>

                  <div className="col-4 col-lg-4 mt-4 mt-lg-0">
                    <p>
                      {item.quantity} x &#8377;{item.price} ={" "}
                      <b>&#8377;{item.quantity * item.price}</b>
                    </p>
                  </div>
                </div>
              </div>
              <hr />
            </Fragment>
          ))}
        </div>

        <div className="col-12 col-lg-3 my-4">
          <div id="order_summary">
            <h4>Order Summary</h4>
            <hr />
            <p>
              Subtotal:{" "}
              <span className="order-summary-values">&#8377;{itemsPrice}</span>
            </p>
            <p>
              Shipping:{" "}
              <span className="order-summary-values">
                &#8377;{shippingPrice}
              </span>
            </p>
            <p>
              Tax:{" "}
              <span className="order-summary-values">&#8377;{taxPrice}</span>
            </p>

            <hr />

            <p>
              Total:{" "}
              <span className="order-summary-values">&#8377;{totalPrice}</span>
            </p>

            <hr />
            <button
              id="checkout_btn"
              onClick={handlePayment}
              className="btn btn-primary btn-block"
            >
              Pay {totalPrice}
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
