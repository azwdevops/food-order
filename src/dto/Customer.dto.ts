import { IsEmail, IsEmpty, Length } from "class-validator";

export class CreateCustomerInputs {
  @IsEmail()
  email: string;

  @Length(7, 14)
  phone: string;

  @Length(6, 12)
  password: string;
}

export interface CustomerPayload {
  _id: string;
  email: string;
  verified: boolean;
}

export class CustomerLoginInputs {
  @IsEmail()
  email: string;

  @Length(6, 12)
  password: string;
}

export class EditCustomerProfileInputs {
  @Length(3, 16)
  firstName: string;

  @Length(3, 16)
  lastName: string;

  @Length(3, 16)
  address: string;
}
export class CartItem {
  _id: string;
  unit: number;
}

export class OrderInputs {
  transactionId: string;
  amount: number;
  items: [CartItem];
}
