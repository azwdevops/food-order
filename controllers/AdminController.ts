import { CreateVendorInput } from "@/dto";
import { VendorModel } from "@/models";
import { GeneratePassword, GenerateSalt } from "@/utils";
import { NextFunction, Request, Response } from "express";

export const FindVendor = async (id: string | undefined, email?: string) => {
  if (email) {
    return await VendorModel.findOne({ email });
  } else if (id) {
    return await VendorModel.findById(id);
  }
  return null;
};

export const CreateVendor = async (req: Request, res: Response, next: NextFunction) => {
  const { name, address, pincode, foodType, email, password, ownerName, phone } = <CreateVendorInput>req.body;

  const existingVendor = await FindVendor("", email);
  if (existingVendor !== null) {
    return res.status(400).json({ message: "A vendor with this email exists" });
  }
  // generate a salt
  const salt = await GenerateSalt();
  const saltedPassword = await GeneratePassword(password, salt);
  // encrypt the password using the salt
  const createdVendor = await VendorModel.create({
    name,
    address,
    pincode,
    foodType,
    email,
    password: saltedPassword,
    salt,
    ownerName,
    phone,
    rating: 0,
    serviceAvailable: false,
    coverImages: [],
    foods: [],
  });

  return res.json(createdVendor);
};

export const GetVendors = async (req: Request, res: Response, next: NextFunction) => {
  const vendors = await VendorModel.find();
  if (vendors !== null) {
    return res.json(vendors);
  }
  return res.json({ message: "No vendors found" });
};

export const GetVendorByID = async (req: Request, res: Response, next: NextFunction) => {
  const vendorId = req.params.id;
  const vendor = await FindVendor(vendorId);
  if (!vendor) {
    return res.json({ message: "Vendor not available" });
  }
  return res.json(vendor);
};
