import mongoose, { Document, Schema } from "mongoose";
import { OrderDoc } from "./OrderModel";
interface CustomerDoc extends Document {
  email: string;
  password: string;
  salt: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  verified: boolean;
  otp: number;
  otp_expiry: Date;
  lat: number;
  lng: number;
  orders: [OrderDoc];
  cart: [any];
}

const CustomerSchema = new Schema(
  {
    email: { type: String, required: true },
    password: { type: String, required: true },
    salt: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    address: { type: String },
    phone: { type: String, required: true },
    verified: { type: Boolean, required: true },
    otp: { type: Date },
    otp_expiry: { type: Number },
    lat: { type: Number },
    lng: { type: Number },
    orders: [{ type: Schema.Types.ObjectId, ref: "order" }],
    cart: [{ food: { type: Schema.Types.ObjectId, ref: "food", required: true }, unit: { type: Number, required: true } }],
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.password, delete ret.salt, delete ret.__v, delete ret.createdAt, delete ret.updatedAt;
      },
    },
    timestamps: true,
  }
);

const CustomerModel = mongoose.model<CustomerDoc>("customer", CustomerSchema);

export { CustomerModel };
