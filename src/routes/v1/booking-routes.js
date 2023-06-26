const { BookingController } = require("../../controllers");
const { BookingMiddleware } = require("../../middlewares");
const express = require("express");

const router = express.Router();
/**
 * route->  /api/v1/bookings - POST
 */
router.post(
  "/",
  BookingMiddleware.validateCreateRequestBody,
  BookingController.createBooking
);

router.post(
  "/payments",
  BookingMiddleware.validatePaymentRequestBody,
  BookingController.makePayment
);

router.get("/:id", BookingController.getBooking);
module.exports = router;
