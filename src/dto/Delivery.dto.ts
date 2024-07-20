import { IsEmail, Length } from "class-validator";

export class CreateDeliveryUserInputs {
  @IsEmail()
  email: string;

  @Length(7, 14)
  phone: string;

  @Length(6, 12)
  password: string;

  @Length(3, 12)
  firstName: string;

  @Length(3, 12)
  lastName: string;

  @Length(6, 24)
  address: string;

  @Length(4, 12)
  pincode: string;
}

export class DeliveryUserLoginInputs {
  @IsEmail()
  email: string;

  @Length(6, 12)
  password: string;
}

export class EditDeliveryUserProfileInputs {
  @Length(3, 16)
  firstName: string;

  @Length(3, 16)
  lastName: string;

  @Length(3, 16)
  address: string;
}
