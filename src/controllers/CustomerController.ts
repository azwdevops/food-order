import { NextFunction, Request, Response } from "express";
import { plainToClass } from "class-transformer";
import { CreateCustomerInputs, CustomerLoginInputs, EditCustomerProfileInputs } from "@/dto/Customer.dto";
import { validate } from "class-validator";
import { GenerateOtp, GeneratePassword, GenerateSalt, GenerateSignature, onRequestOTP, ValidatePassword } from "@/utils";
import { CustomerModel } from "@/models";

export const CustomerSignup = async (req: Request, res: Response, next: NextFunction) => {
  const customerInputs = plainToClass(CreateCustomerInputs, req.body);
  const inputErrors = await validate(customerInputs, { validationError: { target: true } });
  if (inputErrors.length > 0) {
    return res.status(400).json(inputErrors);
  }

  const { email, phone, password } = customerInputs;
  const salt = await GenerateSalt();
  const userPassword = await GeneratePassword(password, salt);

  const { otp, expiry } = GenerateOtp();

  const existingCustomer = await CustomerModel.findOne({ email });
  if (existingCustomer) {
    return res.status(400).json({ message: "A user with this email already exists" });
  }

  const result = await CustomerModel.create({
    email,
    password: userPassword,
    salt,
    phone,
    otp,
    opt_expiry: expiry,
    firstName: "",
    lastName: "",
    address: "",
    verified: false,
    lat: 0,
    lng: 0,
  });
  if (result) {
    // send otp to customer
    await onRequestOTP(otp, phone);
    // generate the signature
    const signature = GenerateSignature({ _id: result.id, email: result.email, verified: result.verified });
    // send the result to client
    return res.status(201).json({ signature, verified: result.verified, email: result.email });
  }
  return res.status(400).json({ message: "Unable to sign up" });
};

export const CustomerLogin = async (req: Request, res: Response, next: NextFunction) => {
  const loginInputs = plainToClass(CustomerLoginInputs, req.body);
  const loginErrors = await validate(loginInputs, { validationError: { target: false } });
  if (loginErrors.length > 0) {
    return res.status(400).json({ message: "Invalid login" });
  }
  const { email, password } = loginInputs;
  const customer = await CustomerModel.findOne({ email });
  if (customer) {
    const validation = await ValidatePassword(password, customer.password, customer.salt);

    if (validation) {
      // generate the signature
      const signature = GenerateSignature({
        _id: customer.id,
        email: customer.email,
        verified: customer.verified,
      });
      return res.status(200).json({ signature, verified: customer.verified, email: customer.email });
    }
  }
  return res.status(404).json({ message: "Invalid login" });
};

export const CustomerVerify = async (req: Request, res: Response, next: NextFunction) => {
  const { otp } = req.body;
  const customer = req.user;
  if (customer) {
    const profile = await CustomerModel.findById(customer._id);
    if (profile) {
      if (profile.otp === parseInt(otp) && profile.otp_expiry >= new Date()) {
        profile.verified = true;
        const updatedCustomerResponse = await profile.save();
        // generate the signature
        const signature = GenerateSignature({
          _id: updatedCustomerResponse.id,
          email: updatedCustomerResponse.email,
          verified: updatedCustomerResponse.verified,
        });
        return res.status(200).json({ signature, verified: updatedCustomerResponse.verified, email: updatedCustomerResponse.email });
      }
    }
  }
  return res.status(400).json({ message: "Error verifying OTP" });
};

export const CustomerRequestOtp = async (req: Request, res: Response, next: NextFunction) => {
  const customer = req.user;
  if (customer) {
    const profile = await CustomerModel.findById(customer._id);
    if (profile) {
      const { otp, expiry } = GenerateOtp();
      profile.otp = otp;
      profile.otp_expiry = expiry;
      await profile.save();
      await onRequestOTP(otp, profile.phone);
      return res.status(200).json({ message: "OTP sent to your registered number" });
    }
  }
  return res.status(400).json({ message: "Error requesting new OTP" });
};

export const GetCustomerProfile = async (req: Request, res: Response, next: NextFunction) => {
  const customer = req.user;
  if (customer) {
    const profile = await CustomerModel.findById(customer._id);
    if (profile) {
      return res.status(200).json(profile);
    }
  }
  return res.status(400).json({ message: "Error fetching customer profile" });
};

export const UpdateCustomerProfile = async (req: Request, res: Response, next: NextFunction) => {
  const customer = req.user;
  const profileInputs = plainToClass(EditCustomerProfileInputs, req.body);
  const profileErrors = await validate(profileInputs, { validationError: { target: false } });
  if (profileErrors.length > 0) {
    return res.status(400).json(profileErrors);
  }
  const { firstName, lastName, address } = profileInputs;
  if (customer) {
    const profile = await CustomerModel.findById(customer._id);
    if (profile) {
      profile.firstName = firstName;
      profile.lastName = lastName;
      profile.address = address;

      const result = await profile.save();

      return res.status(200).json(result);
    }
  }
};
