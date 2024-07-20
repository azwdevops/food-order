import { NextFunction, Request, Response } from "express";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { GeneratePassword, GenerateSalt, GenerateSignature, ValidatePassword } from "@/utils";
import { DeliveryUserModel } from "@/models";
import { CreateDeliveryUserInputs, DeliveryUserLoginInputs, EditDeliveryUserProfileInputs } from "@/dto";

export const DeliveryUserSignup = async (req: Request, res: Response, next: NextFunction) => {
  const deliveryUserInputs = plainToClass(CreateDeliveryUserInputs, req.body);
  const inputErrors = await validate(deliveryUserInputs, { validationError: { target: true } });
  if (inputErrors.length > 0) {
    return res.status(400).json(inputErrors);
  }

  const { email, phone, password, firstName, lastName, address, pincode } = deliveryUserInputs;
  const salt = await GenerateSalt();
  const userPassword = await GeneratePassword(password, salt);

  const existingDeliveryUser = await DeliveryUserModel.findOne({ email });
  if (existingDeliveryUser) {
    return res.status(400).json({ message: "A user with this email already exists" });
  }

  const result = await DeliveryUserModel.create({
    email,
    password: userPassword,
    salt,
    phone,
    firstName,
    lastName,
    address,
    pincode,
    verified: false,
    lat: 0,
    lng: 0,
    isAvailable: false,
  });
  if (result) {
    // generate the signature
    const signature = GenerateSignature({ _id: result.id, email: result.email, verified: result.verified });
    // send the result to client
    return res.status(201).json({ signature, verified: result.verified, email: result.email });
  }
  return res.status(400).json({ message: "Unable to sign up" });
};

export const DeliveryUserLogin = async (req: Request, res: Response, next: NextFunction) => {
  const loginInputs = plainToClass(DeliveryUserLoginInputs, req.body);
  const loginErrors = await validate(loginInputs, { validationError: { target: false } });
  if (loginErrors.length > 0) {
    return res.status(400).json({ message: "Invalid login" });
  }
  const { email, password } = loginInputs;
  const deliveryUser = await DeliveryUserModel.findOne({ email });
  if (deliveryUser) {
    const validation = await ValidatePassword(password, deliveryUser.password, deliveryUser.salt);

    if (validation) {
      // generate the signature
      const signature = GenerateSignature({
        _id: deliveryUser.id,
        email: deliveryUser.email,
        verified: deliveryUser.verified,
      });
      return res.status(200).json({ signature, verified: deliveryUser.verified, email: deliveryUser.email });
    }
  }
  return res.status(404).json({ message: "Invalid login" });
};

export const GetDeliveryUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  const deliveryUser = req.user;
  if (deliveryUser) {
    const profile = await DeliveryUserModel.findById(deliveryUser._id);
    if (profile) {
      return res.status(200).json(profile);
    }
  }
  return res.status(400).json({ message: "Error fetching deliveryUser profile" });
};

export const UpdateDeliveryUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  const deliveryUser = req.user;
  const profileInputs = plainToClass(EditDeliveryUserProfileInputs, req.body);
  const profileErrors = await validate(profileInputs, { validationError: { target: false } });
  if (profileErrors.length > 0) {
    return res.status(400).json(profileErrors);
  }
  const { firstName, lastName, address } = profileInputs;
  if (deliveryUser) {
    const profile = await DeliveryUserModel.findById(deliveryUser._id);
    if (profile) {
      profile.firstName = firstName;
      profile.lastName = lastName;
      profile.address = address;
      const result = await profile.save();
      return res.status(200).json(result);
    }
  }
  return res.status(400).json({ message: "Error updating deliveryUser profile" });
};

export const UpdateDeliveryUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  const deliveryUser = req.user;

  if (deliveryUser) {
    const { lat, lng } = req.body;
    const profile = await DeliveryUserModel.findById(deliveryUser._id);
    if (profile) {
      if (lat && lng) {
        profile.lat = lat;
        profile.lng = lng;
      }
      profile.isAvailable = !profile.isAvailable;

      const result = await profile.save();
      return res.status(200).json(result);
    }
  }
  return res.status(400).json({ message: "Error updating profile status" });
};
