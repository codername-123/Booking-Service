const { ErrorResponse } = require("../utils/common");
const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");

function validateCreateRequestBody(req, res, next) {
  if (!req.body.flightId || !req.body.userId || !req.body.noOfSeats) {
    ErrorResponse.message = "Something went wrong";
    ErrorResponse.error = new AppError(
      ["you have not sent the correct request body"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(ErrorResponse.error.statusCode).json(ErrorResponse);
  }
  next();
}

function validatePaymentRequestBody(req, res, next) {
  if (!req.body.bookingId || !req.body.userId || !req.body.totalCost) {
    ErrorResponse.message = "Something went wrong";
    ErrorResponse.error = new AppError(
      ["you have not sent the correct request body"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(ErrorResponse.error.statusCode).json(ErrorResponse);
  }
  next();
}
module.exports = {
  validateCreateRequestBody,
  validatePaymentRequestBody,
};
