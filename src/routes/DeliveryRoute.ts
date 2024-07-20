import { DeliveryUserLogin, DeliveryUserSignup, GetDeliveryUserProfile, UpdateDeliveryUserProfile, UpdateDeliveryUserStatus } from "@/controllers";
import { Authenticate } from "@/middlewares";
import express from "express";
const router = express.Router();

router.post("/signup", DeliveryUserSignup);
router.post("/login", DeliveryUserLogin);

// authentication middleware
router.use(Authenticate);

router.put("/change-status", UpdateDeliveryUserStatus);
router.get("/profile", GetDeliveryUserProfile);

router.patch("/profile", UpdateDeliveryUserProfile);

export { router as DeliveryRoute };
