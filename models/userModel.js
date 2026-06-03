import Mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import crypto from "crypto";
const userSchema = new Mongoose.Schema({
  name: {
    type: String,
    required: [true, "the name is require"],
    minLength: [5, "the name must be more than 5 letters"],
    maxLengt: [20, "the name must be less than 20 letters"],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, "please provide your phone number"],
    unique: true,

    validate: {
      validator: function (value) {
        return /^01[0125][0-9]{8}$/.test(value);
      },
      message: "please provide a valid egyptian phone number",
    },
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ["patient", "admin", "doctor", "receptionist"],
    default: "patient",
  },
  password: {
    type: String,
    required: [true, "the password is require"],
    minLength: [8, "password must be more than 8 characters"],
    select: false,
  },
  confirmpassword: {
    type: String,
    required: [true, "the confirmpassword is require"],
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
  },
});
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmpassword = undefined;
  next();
});
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});
userSchema.methods.correctPassword = async (
  candidatePassword,
  userpassword,
) => {
  return await bcrypt.compare(candidatePassword, userpassword);
};
userSchema.methods.changedPasswordAfter = function (tokenDate) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return changedTimestamp > tokenDate;
  }
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
const User = Mongoose.model("User", userSchema);
export default User;
