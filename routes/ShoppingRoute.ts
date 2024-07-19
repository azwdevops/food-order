import { GetFoodAvailability, GetFoodsIn30Min, GetRestaurantById, GetTopRestaurants, SearchFoods } from "@/controllers/ShoppingController";
import express from "express";

const router = express.Router();

/** ---------------------- FOOD AVAILABILITY ------------------------- */
router.get("/:pincode", GetFoodAvailability);
/** ---------------------- TOP RESTAURANTS ------------------------- */
router.get("/top-restaurants/:pincode", GetTopRestaurants);
/** ---------------------- FOOD AVAILABLE IN 30 MINUTES ------------------------- */
router.get("/foods-in-30-min/:pincode", GetFoodsIn30Min);
/** ---------------------- SEARCH FOODS ------------------------- */
router.get("/search/:pincode", SearchFoods);
/** ---------------------- FIND RESTAURANT BY ID ------------------------- */
router.get("/restaurant/:id", GetRestaurantById);

export { router as ShoppingRoute };
