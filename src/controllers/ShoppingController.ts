import { FoodDoc, OfferModel, VendorModel } from "@/models";
import { NextFunction, Request, Response } from "express";

export const GetFoodAvailability = async (req: Request, res: Response, next: NextFunction) => {
  const pincode = req.params.pincode;
  const result = await VendorModel.find({ pincode, serviceAvailable: false })
    .sort([["rating", "descending"]])
    .populate("foods");
  if (result.length > 0) {
    return res.status(200).json(result);
  }
  return res.status(400).json({ message: "Data not found" });
};

export const GetTopRestaurants = async (req: Request, res: Response, next: NextFunction) => {
  const pincode = req.params.pincode;
  const result = await VendorModel.find({ pincode, serviceAvailable: false })
    .sort([["rating", "descending"]])
    .limit(1);
  if (result.length > 0) {
    return res.status(200).json(result);
  }
  return res.status(400).json({ message: "Data not found" });
};

export const GetFoodsIn30Min = async (req: Request, res: Response, next: NextFunction) => {
  const pincode = req.params.pincode;
  const result = await VendorModel.find({ pincode, serviceAvailable: false }).populate("foods");

  if (result.length > 0) {
    const foodResult: any = [];
    result.map((vendor) => {
      const foods = vendor.foods as [FoodDoc];
      foodResult.push(...foods.filter((food) => food.readyTime <= 30));
    });
    return res.status(200).json(foodResult);
  }
  return res.status(400).json({ message: "Data not found" });
};

export const SearchFoods = async (req: Request, res: Response, next: NextFunction) => {
  const pincode = req.params.pincode;
  const result = await VendorModel.find({ pincode, serviceAvailable: false }).populate("foods");

  if (result.length > 0) {
    const foodresult: any = [];
    result.map((vendor) => foodresult.push(...vendor.foods));
    return res.status(200).json(foodresult);
  }
  return res.status(400).json({ message: "Data not found" });
};

export const GetRestaurantById = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;
  const result = await VendorModel.findById(id).populate("foods");
  if (result !== null) {
    return res.status(200).json(result);
  }
  return res.status(400).json({ message: "Data not found" });
};

export const GetAvailableOffers = async (req: Request, res: Response, next: NextFunction) => {
  const pincode = req.params.pincode;
  const offers = await OfferModel.find({ pincode, isActive: true });
  if (offers.length > 0) {
    return res.status(200).json(offers);
  }
  return res.status(400).json({ message: "No offers found" });
};
