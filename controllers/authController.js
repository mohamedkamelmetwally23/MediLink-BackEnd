import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";
import client from "../config/redis.js";
import sendOTP from "../utils/sendOTP.js";
import { json } from "express";

export const signUp = catchAsync(async (req, res, next) => {
  const { name, phone, password, confirmpassword } = req.body;
  if (!name || !phone || !password || !confirmpassword)
    return next(new AppError("please complete all fields", 400));
  const user = await User.findOne({ phone });
  if (user)
    return next(
      new AppError("phone already exist try another phone number", 400),
    );
  if (password !== confirmpassword)
    return next(
      new AppError("password and confirm password does not the same", 400),
    );

  const otp = Math.floor(100000 + Math.random() * 900000);
  ////////////// save data and otp in redis server//////////////////////////

  const key = `signUp:${phone}`;

  const value = {
    name,
    phone,
    password,
    otp,
  };
  await client.set(key, JSON.stringify(value), {
    EX: 300,
  });
  if (process.env.NODE_ENV === "development") {
    console.log("OTP:", otp);
  } else {
    await sendOTP(phone, otp);
  }
  res.status(200).json({
    status: "success",
    message: "check your phone SMS we send OTP verification to you",
  });
});
export const verifyOTP = catchAsync(async (req, res, next) => {
  const { name, phone, password, otp } = JSON.parse(
    await client.get(`signUp:${req.body.phone}`),
  );

  if (+otp !== +req.body.otp) return next(new AppError("invalid otp ", 400));
  const newUser = await User.create({
    name,
    phone,
    password,
    confirmpassword: password,
  });
  await client.del(`signUp:${phone}`);
  res.status(200).json({
    status: "success",
    data: {
      user: newUser,
    },
  });
});
