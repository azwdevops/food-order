import { CreateVendorInput } from "@/dto";
import { DeliveryUserModel, TransactionModel, VendorModel } from "@/models";
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
    lat: 0,
    lng: 0,
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

export const GetTransactions = async (req: Request, res: Response, next: NextFunction) => {
  const transactions = await TransactionModel.find();
  if (transactions.length > 0) {
    return res.status(200).json(transactions);
  }
  return res.json({ message: "No transactions available" });
};

export const GetTransactionById = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;
  const transaction = await TransactionModel.findById(id);
  if (transaction) {
    return res.status(200).json(transaction);
  }
  return res.status(404).json({ message: "Transaction is not available" });
};

export const VerifyDeliveryUser = async (req: Request, res: Response, next: NextFunction) => {
  const { _id, status } = req.body;
  if (_id) {
    const profile = await DeliveryUserModel.findById(_id);
    if (profile) {
      profile.verified = status;
      const result = await profile.save();

      return res.status(200).json(result);
    }
  }
  return res.status(400).json({ message: "Unable to verify delivery user" });
};

export const GetDeliveryUsers = async (req: Request, res: Response, next: NextFunction) => {
  const deliveryUsers = await DeliveryUserModel.find();

  return res.status(200).json(deliveryUsers);
};
