import { CreateOfferInputs, EditVendorInput, VendorLoginInput } from "@/dto";
import { NextFunction, Request, Response } from "express";
import { FindVendor } from "./AdminController";
import { GenerateSignature, ValidatePassword } from "@/utils";
import { CreateFoodInputs } from "@/dto/Food.dto";
import { FoodModel, OfferModel, OrderModel } from "@/models";

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
  const { lat, lng } = req.body;
  if (user) {
    const existingVendor = await FindVendor(user._id);
    if (existingVendor !== null) {
      existingVendor.serviceAvailable = !existingVendor.serviceAvailable;
      if (lat && lng) {
        existingVendor.lat = lat;
        existingVendor.lng = lng;
      }
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

export const GetCurrentOrders = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;

  if (user) {
    const orders = await OrderModel.find({ vendorId: user._id }).populate("items.food");

    if (orders != null) {
      return res.status(200).json(orders);
    }
  }

  return res.json({ message: "Orders Not found" });
};

export const GetOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
  const orderId = req.params.id;

  if (orderId) {
    const order = await OrderModel.findById(orderId).populate("items.food");

    if (order != null) {
      return res.status(200).json(order);
    }
  }

  return res.json({ message: "Order Not found" });
};

export const ProcessOrder = async (req: Request, res: Response, next: NextFunction) => {
  const orderId = req.params.id;

  const { status, remarks, time } = req.body;

  if (orderId) {
    const order = await OrderModel.findById(orderId).populate("food");

    order.orderStatus = status;
    order.remarks = remarks;
    if (time) {
      order.readyTime = time;
    }

    const orderResult = await order.save();

    if (orderResult != null) {
      return res.status(200).json(orderResult);
    }
  }

  return res.json({ message: "Unable to process order" });
};

export const GetOffers = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user) {
    const currentOffers = Array();
    const offers = await OfferModel.find().populate("vendors");
    if (offers) {
      offers.map((item) => {
        if (item.vendors) {
          item.vendors.map((vendor) => {
            if (vendor._id.toString() === user._id) {
              currentOffers.push(item);
            }
          });
        }
        if (item.offerType === "GENERIC") {
          currentOffers.push(item);
        }
      });
    }
    return res.status(200).json(currentOffers);
  }
  return res.status(400).json({ message: "Offers not available" });
};

export const AddOffer = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user) {
    const { title, description, offerType, offerAmount, pincode, promocode, promoType, startValidity, endValidity, bank, bins, minValue, isActive } = <
      CreateOfferInputs
    >req.body;
    const vendor = await FindVendor(user._id);
    if (vendor) {
      const offer = await OfferModel.create({
        title,
        description,
        offerType,
        offerAmount,
        pincode,
        promocode,
        promoType,
        startValidity,
        endValidity,
        bank,
        bins,
        isActive,
        minValue,
        vendors: [vendor],
      });
      return res.status(201).json(offer);
    }
  }
  return res.status(400).json({ message: "Error, creating offer failed" });
};
export const EditOffer = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  const offerId = req.params.id;
  if (user) {
    const { title, description, offerType, offerAmount, pincode, promocode, promoType, startValidity, endValidity, bank, bins, minValue, isActive } = <
      CreateOfferInputs
    >req.body;

    const currentOffer = await OfferModel.findById(offerId);
    if (currentOffer) {
      const vendor = await FindVendor(user._id);
      if (vendor) {
        currentOffer.title = title;
        currentOffer.description = description;
        currentOffer.offerType = offerType;
        currentOffer.offerAmount = offerAmount;
        currentOffer.pincode = pincode;
        currentOffer.promocode = promocode;
        currentOffer.promoType = promoType;
        currentOffer.startValidity = startValidity;
        currentOffer.endValidity = endValidity;
        currentOffer.bank = bank;
        currentOffer.bins = bins;
        currentOffer.isActive = isActive;
        currentOffer.minValue = minValue;

        const result = await currentOffer.save();
        return res.status(201).json(result);
      }
    }
  }
  return res.status(400).json({ message: "Error, creating offer failed" });
};
