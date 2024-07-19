import mongoose from "mongoose";
import { MONGO_URI } from "@/config";

export default async () => {
  await mongoose
    .connect(`${MONGO_URI}`)
    .then((res) => {
      console.log("DB Connected");
    })
    .catch((err) => {
      console.log(err);
    });
};
