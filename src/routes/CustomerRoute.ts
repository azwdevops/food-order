import {
  AddToCart,
  CreateOrder,
  CreatePayment,
  CustomerLogin,
  CustomerRequestOtp,
  CustomerSignup,
  CustomerVerify,
  DeleteCart,
  GetCart,
  GetCustomerProfile,
  GetOrderById,
  GetOrders,
  UpdateCustomerProfile,
  VerifyOffer,
} from "@/controllers";
import { Authenticate } from "@/middlewares";
import express from "express";

const router = express.Router();

//  CREATE CUSTOMER
router.post("/signup", CustomerSignup);

// LOGIN
router.post("/login", CustomerLogin);

// authentication
router.use(Authenticate);

// VERIFY CUSTOMER ACCOUNT
router.patch("/verify", CustomerVerify);
// OTP/ REQUESTING OTP
router.get("/otp", CustomerRequestOtp);
// PROFILE
router.get("/profile", GetCustomerProfile);
router.patch("/profile", UpdateCustomerProfile);

router.post("/cart", AddToCart);
router.get("/cart", GetCart);
router.delete("/cart", DeleteCart);

// ORDER
router.post("/create-order", CreateOrder);
router.get("/orders", GetOrders);
router.get("/order/:id", GetOrderById);

// offers
router.get("/offer/verify/:id", VerifyOffer);

// PAYMENT
router.post("/create-payment", CreatePayment);

export { router as CustomerRoute };
