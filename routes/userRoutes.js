import { signUp, verifyOTP } from "../controllers/authController.js";
import express from "express";
const userRouter = express.Router();
userRouter.post("/signup", signUp);
userRouter.post("/verifyOTP", verifyOTP);

export default userRouter;
