import dotenv from "dotenv";
dotenv.config();

export const MONGO_URI = `${process.env.MONGO_URI}`;
export const APP_SECRET = `${process.env.APP_SECRET}`;
export const TWILIO_ACCOUNT_SID = `${process.env.TWILIO_ACCOUNT_SID}`;
export const TWILIO_AUTH_TOKEN = `${process.env.TWILIO_AUTH_TOKEN}`;
export const TWILIO_NUMBER = `${process.env.TWILIO_NUMBER}`;
export const PORT = `${process.env.PORT}` || 5000;
