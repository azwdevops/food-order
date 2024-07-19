import { EditVendorInput, VendorLoginInput } from "@/dto";
import { NextFunction, Request, Response } from "express";
import { FindVendor } from "./AdminController";
import { GenerateSignature, ValidatePassword } from "@/utils";
import { CreateFoodInputs } from "@/dto/Food.dto";
import { FoodModel } from "@/models";

export const VendorLogin = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = <VendorLoginInput>req.body;
  const existingVendor = await FindVendor("", email);
  if (!existingVendor) {
    return res.status(404).json({ message: "Invalid login" });
  }
  // validation and give access
  const validation = await ValidatePassword(password, existingVendor.password, existingVendor.salt);
  if (!validation) {
    return res.status(400).json({ message: "Invalid login" });
  }
  const signature = GenerateSignature({
    _id: existingVendor.id,
    email: existingVendor.email,
    name: existingVendor.name,
  });
  return res.status(200).json(signature);
};

export const GetVendorProfile = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user) {
    const existingVendor = await FindVendor(user._id);
    return res.json(existingVendor);
  }
  return res.json({ message: "Vendor information not found" });
};

export const UpdateVendorProfile = async (req: Request, res: Response, next: NextFunction) => {
  const { foodTypes, address, name, phone } = <EditVendorInput>req.body;

  const user = req.user;
  if (user) {
    const existingVendor = await FindVendor(user._id);
    if (existingVendor !== null) {
      existingVendor.name = name;
      existingVendor.address = address;
      existingVendor.phone = phone;
      existingVendor.foodType = foodTypes;

      const savedResult = await existingVendor.save();
      return res.json(savedResult);
    }
    return res.json(existingVendor);
  }
  return res.json({ message: "Vendor information not found" });
};

export const UpdateVendorCoverImage = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user) {
    const vendor = await FindVendor(user._id);
    if (vendor !== null) {
      const files = req.files as [Express.Multer.File];

      const images = files.map((file: Express.Multer.File) => file.filename);
      vendor.coverImages.push(...images);
      const result = await vendor.save();

      return res.json(result);
    }
  }
};

export const UpdateVendorService = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user) {
    const existingVendor = await FindVendor(user._id);
    if (existingVendor !== null) {
      existingVendor.serviceAvailable = !existingVendor.serviceAvailable;
      const savedResult = await existingVendor.save();
      return res.json(savedResult);
    }
    return res.json(existingVendor);
  }
  return res.json({ message: "Vendor information not found" });
};

export const AddFood = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user) {
    const { name, description, category, foodType, readyTime, price } = <CreateFoodInputs>req.body;
    const vendor = await FindVendor(user._id);
    if (vendor !== null) {
      const files = req.files as [Express.Multer.File];

      const images = files.map((file: Express.Multer.File) => file.filename);

      const createdFood = await FoodModel.create({
        vendorId: vendor._id,
        name,
        description,
        category,
        foodType,
        readyTime,
        price,
        images: images,
        rating: 0,
      });
      vendor.foods.push(createdFood);
      const result = await vendor.save();

      return res.json(result);
    }
  }

  return res.json({ message: "Unable to add food" });
};

export const GetFoods = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user) {
    const foods = await FoodModel.find({ vendorId: user._id });
    if (foods !== null) {
      return res.json(foods);
    }
  }

  return res.json({ message: "Food information not found" });
};
