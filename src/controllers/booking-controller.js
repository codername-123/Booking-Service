const { BookingService } = require("../services");
const { SuccessResponse, ErrorResponse } = require("../utils/common");
const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");

const inMemDb = {};
/**
 * POST: /bookings
 * req.body: {flightId: 2}
 */
async function createBooking(req, res) {
  try {
    const booking = await BookingService.createBooking({
      flightId: req.body.flightId,
      userId: req.body.userId,
      noOfSeats: req.body.noOfSeats,
    });

    SuccessResponse.data = booking;
    SuccessResponse.message = "Successfully created the booking";
    return res.status(StatusCodes.CREATED).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.error = error;
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
  }
}
/**
 * POST: /payments
 * req.body: {bookingId: 2, userId: 3, totalCost: 39009}
 */
async function makePayment(req, res) {
  try {
    const idempotencyKey = req.headers["x-idempotency-key"];
    if (!idempotencyKey) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Idempotency header not set" });
    }
    if (inMemDb[idempotencyKey]) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Cannot retry on a successfull payment" });
    }
    const response = await BookingService.makePayment({
      bookingId: req.body.bookingId,
      userId: req.body.userId,
      totalCost: req.body.totalCost,
    });

    inMemDb[idempotencyKey] = [idempotencyKey];
    SuccessResponse.data = response;
    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.error = error;
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
  }
}
/**
 * GET: /bookings/:id
 * req.body: {}
 */
async function getBooking(req, res) {
  try {
    const response = await BookingService.getBooking(req.params.id);
    SuccessResponse.data = response;
    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.error = error;
    return res.status(error.statuscode).json(ErrorResponse);
  }
}
module.exports = { createBooking, makePayment, getBooking };
