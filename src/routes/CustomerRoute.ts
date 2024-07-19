import { CustomerLogin, CustomerRequestOtp, CustomerSignup, CustomerVerify, GetCustomerProfile, UpdateCustomerProfile } from "@/controllers";
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
// CART

// ORDER

// PAYMENT

export { router as CustomerRoute };
