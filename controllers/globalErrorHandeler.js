import AppError from "../utils/appError.js";

function castError(err) {
  const message = `invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
}

function duplicateError(err) {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  return new AppError(`duplicated field of ${value}`, 400);
}
function ValidationError(err) {
  const error = Object.values(err.errors)
    .map((el) => el.message)
    .join(".  ");
  return new AppError(`Invalid input data. ${error}`, 400);
}

function devError(err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
}
function prodError(err, res) {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("error🐦‍🔥", err);
    res.status(500).json({
      status: "error",
      message: "something went wrong",
    });
  }
}
export function globalError(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV == "development") {
    devError(err, res);
  } else if (process.env.NODE_ENV == "production") {
    if (err.name === "CastError") err = castError(err);

    if (err.code === 11000) err = duplicateError(err);
    if (err.name === "ValidationError") err = ValidationError(err);

    prodError(err, res);
  }
}
