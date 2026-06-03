import twilio from "twilio";

const sendOTP = async (otp, phone) => {
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

  await client.messages.create({
    body: `your otp is ${otp}`,
    from: process.env.TWILIO_PHONE,
    to: phone,
  });
};
export default sendOTP;
