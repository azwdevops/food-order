import mongoose, { Document, Schema } from "mongoose";

export interface OrderDoc extends Document {
  vendorID: string;
  orderID: string;
  items: [any];
  totalAmount: number;
  paidAmount: number;
  orderDate: Date;
  orderStatus: string;
  remarks: string;
  readyTime: number;
  deliveryId: string;
}

const OrderSchema = new Schema(
  {
    orderID: { type: String, required: true },
    vendorID: { type: String, required: true },
    items: [{ food: { type: Schema.Types.ObjectId, ref: "food", required: true }, unit: { type: Number, required: true } }],
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    orderDate: { type: Date },
    orderStatus: { type: String },
    remarks: { type: String },
    readyTime: { type: Number },
    deliveryId: { type: String },
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.__v, delete ret.createdAt, delete ret.updateAt;
      },
    },
    timestamps: true,
  }
);

const OrderModel = mongoose.model<OrderDoc>("order", OrderSchema);

export { OrderModel };
