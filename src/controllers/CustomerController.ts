import { NextFunction, Request, Response } from "express";
import { plainToClass } from "class-transformer";
import { CartItem, CreateCustomerInputs, CustomerLoginInputs, EditCustomerProfileInputs, OrderInputs } from "@/dto/Customer.dto";
import { validate } from "class-validator";
import { GenerateOtp, GeneratePassword, GenerateSalt, GenerateSignature, onRequestOTP, ValidatePassword } from "@/utils";
import { CustomerModel, DeliveryUserModel, FoodModel, OfferModel, OrderModel, TransactionModel, VendorModel } from "@/models";

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
    orders: [],
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

export const AddToCart = async (req: Request, res: Response, next: NextFunction) => {
  const customer = req.user;
  if (customer) {
    const profile = await CustomerModel.findById(customer._id);
    let cartItems = Array();

    const { _id, unit } = <CartItem>req.body;

    const food = await FoodModel.findById(_id);

    if (food) {
      if (profile != null) {
        cartItems = profile.cart;
        if (cartItems.length > 0) {
          let existingFoodItems = cartItems.filter((item) => item.food._id.toString() === _id);
          if (existingFoodItems?.length > 0) {
            const index = cartItems.indexOf(existingFoodItems[0]);
            if (unit > 0) {
              cartItems[index] = { food, unit };
            } else {
              cartItems.splice(index, 1);
            }
          } else {
            cartItems.push({ food, unit });
          }
          if (cartItems) {
            profile.cart = cartItems as any;
            const cartResult = await profile.save();
            return res.status(200).json(cartResult.cart);
          }
        }
      }
    }
  }
  return res.status(404).json({ message: "Unable to add to cart" });
};

export const CreatePayment = async (req: Request, res: Response, next: NextFunction) => {
  const customer = req.user;
  const { amount, paymentMode, offerId } = req.body;
  let payableAmount = Number(amount);
  if (offerId) {
    const appliedOffer = await OfferModel.findById(offerId);
    if (appliedOffer) {
      if (appliedOffer.isActive) {
        payableAmount = payableAmount - Number(appliedOffer.offerAmount);
      }
    }
  }

  const transaction = await TransactionModel.create({
    customer: customer._id,
    vendorId: "",
    orderId: "",
    orderValue: payableAmount,
    offerUsed: offerId || "NA",
    status: "OPEN",
    paymentMode,
    paymentResponse: "Payment is cash on delivery",
  });

  return res.status(200).json(transaction);
};

const assignOrderForDelivery = async (orderId: string, vendorId: string) => {
  // find the vendor
  const vendor = await VendorModel.findById(vendorId);
  if (vendor) {
    const areaCode = vendor.pincode;
    const vendorLat = vendor.lat;
    const vendorLng = vendor.lng;

    // find the delivery person
    const deliveryPersons = await DeliveryUserModel.find({ pincode: areaCode, verified: true, isAvailable: true });

    if (deliveryPersons) {
      // check the nearest delivery person and assign the order
      const currentOrder = await OrderModel.findById(orderId);
      if (currentOrder) {
        // update deliveryID
        currentOrder.deliveryId = deliveryPersons[0]._id.toString();
        await currentOrder.save();

        // notify vendor for received new order using firebase push notification
      }
    }
  }
};

const validateTransaction = async (transactionId: string) => {
  const currentTransaction = await TransactionModel.findById(transactionId);
  if (currentTransaction) {
    if (currentTransaction.status.toLowerCase() !== "failed") {
      return { status: true, currentTransaction };
    }
  }
  return { status: false, currentTransaction };
};

export const CreateOrder = async (req: Request, res: Response, next: NextFunction) => {
  // grab current login customer
  const customer = req.user;

  const { transactionId, amount, items } = <OrderInputs>req.body;

  if (customer) {
    const { status, currentTransaction } = await validateTransaction(transactionId);
    if (!status) {
      return res.status(404).json({ message: "Error creating order" });
    }

    const orderID = `${Math.floor(Math.random() * 89999) + 1000}`;
    const profile = await CustomerModel.findById(customer._id);

    const cartItems = Array();
    let netAmount = 0.0;
    let vendorID;

    const foods = await FoodModel.find()
      .where("_id")
      .in(items.map((item) => item._id))
      .exec();
    foods.map((food) => {
      items.map(({ _id, unit }) => {
        if (food._id == _id) {
          vendorID = food.vendorId;
          netAmount += food.price * unit;
          cartItems.push({ food, unit });
        }
      });
    });

    if (cartItems) {
      const currentOrder = await OrderModel.create({
        orderID,
        vendorID,
        items: cartItems,
        totalAmount: netAmount,
        paidAmount: amount,
        orderDate: new Date(),
        orderStatus: "Waiting",
        remarks: "",
        deliveryId: "",
        readyTime: 45,
      });
      profile.cart = [] as any;
      profile.orders.push(currentOrder);

      currentTransaction.vendorId = vendorID;
      currentTransaction.orderId = orderID;
      currentTransaction.status = " CONFIRMED";
      await currentTransaction.save();

      assignOrderForDelivery(currentOrder._id.toString(), vendorID);

      const profileResponse = await profile.save();

      return res.status(201).json(profileResponse);
    }
  }
  return res.status(400).json({ message: "Error creating order" });
};

export const GetOrders = async (req: Request, res: Response, next: NextFunction) => {
  const customer = req.user;
  if (customer) {
    const profile = await CustomerModel.findById(customer._id).populate("orders");
    if (profile) {
      return res.status(200).json(profile.orders);
    }
  }
};

export const GetOrderById = async (req: Request, res: Response, next: NextFunction) => {
  const orderId = req.params.id;
  if (orderId) {
    const order = await OrderModel.findById(orderId).populate("items.food");
    return res.status(200).json(order);
  }
};

export const GetCart = async (req: Request, res: Response, next: NextFunction) => {
  const customer = req.user;
  if (customer) {
    const profile = await CustomerModel.findById(customer._id);
    if (profile) {
      return res.status(200).json(profile.cart);
    }
  }
  return res.status(400).json({ message: "Cart is empty" });
};

export const DeleteCart = async (req: Request, res: Response, next: NextFunction) => {
  const customer = req.user;
  if (customer) {
    const profile = await CustomerModel.findById(customer._id).populate("cart.food").exec();
    if (profile != null) {
      profile.cart = [] as any;
      const cartResult = await profile.save();
      return res.status(200).json(cartResult);
    }
  }
  return res.status(400).json({ message: "Cart is already empty" });
};

export const VerifyOffer = async (req: Request, res: Response, next: NextFunction) => {
  const offerId = req.params.id;
  const customer = req.user;
  if (customer) {
    const appliedOffer = await OfferModel.findById(offerId);
    if (appliedOffer) {
      if (appliedOffer.promoType === "USER") {
        // if only can apply once per user
      } else {
        if (appliedOffer.isActive) {
          return res.status(200).json({ messahe: "Offer is valid", offer: appliedOffer });
        }
      }
    }
  }
  return res.status(400).json({ message: "Offer is not valid" });
};
