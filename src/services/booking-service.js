const axios = require("axios");
const { BookingRepository } = require("../repositories");
const { StatusCodes } = require("http-status-codes");
const { ServerConfig, Queue } = require("../config");
const db = require("../models");
const AppError = require("../utils/errors/app-error");
const { Enums } = require("../utils/common");
const { BOOKED, CANCELLED } = Enums.BOOKING_STATUS;

const bookingRepository = new BookingRepository();

async function createBooking(data) {
  const t = await db.sequelize.transaction();
  try {
    const flight = await axios.get(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`
    );
    const flightData = flight.data.data;
    if (data.seats > flightData.seats) {
      throw new AppError(
        "Number of seats exceeds available seats",
        StatusCodes.BAD_REQUEST
      );
    }
    const totalBillingAmount = data.noOfSeats * flightData.price;
    const bookingPayload = { ...data, totalCost: totalBillingAmount };
    const booking = await bookingRepository.createBooking(bookingPayload, t);

    await axios.patch(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}/seats`,
      { seats: data.noOfSeats, dec: true }
    );

    await t.commit();
    return booking;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function makePayment(data) {
  const t = await db.sequelize.transaction();
  try {
    const bookingDetails = await bookingRepository.get(data.bookingId, {
      transaction: t,
    });

    if (bookingDetails.status === CANCELLED) {
      throw new AppError("Booking Expired", StatusCodes.BAD_REQUEST);
    }

    const bookingTime = new Date(bookingDetails.createdAt);
    const currentTime = new Date();

    if (currentTime - bookingTime > 300000) {
      await cancelBooking(data.bookingId);
      throw new AppError("Booking Expired", StatusCodes.BAD_REQUEST);
    }
    if (bookingDetails.totalCost !== data.totalCost) {
      throw new AppError(
        "The amount of payment does not match",
        StatusCodes.BAD_REQUEST
      );
    }
    if (bookingDetails.userId !== data.userId) {
      throw new AppError(
        "The user corresponding to booking doesnot exsit",
        StatusCodes.BAD_REQUEST
      );
    }

    // We assume payment is successfull
    const resp = await bookingRepository.update(
      data.bookingId,
      {
        status: BOOKED,
      },
      t
    );

    await t.commit();

    // TODO: get actual user data instead of hardcoding the email
    await Queue.sendData({
      content: `Booking successfully done ${bookingDetails.flightId}`,
      subject: "Regarding your flight booking",
      recipientEmail: "shivam.rawat21.629@gmail.com",
    });
  } catch (error) {
    await t.rollback();
    console.log(error);
    throw error;
  }

  async function cancelBooking(bookingId) {
    const t = await db.sequelize.transaction();
    try {
      const bookingDetails = await bookingRepository.get(bookingId, {
        transaction: t,
      });
      if (bookingDetails.status === CANCELLED) {
        await t.commit();
        return;
      }

      await axios.patch(
        `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${bookingDetails.flightId}/seats`,
        { seats: bookingDetails.noOfSeats, dec: false }
      );

      await bookingRepository.update(
        bookingId,
        {
          status: CANCELLED,
        },
        t
      );

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

// Todo: number of seats in a flight should never be greater or less than the number of seats specified by the airplane flying the passengers
async function cancelOldBookings() {
  try {
    const time = new Date(new Date() - 1000 * 1 * 60);
    const oldBookings = await bookingRepository.getOldBookings(time);
    for (const booking of oldBookings) {
      await axios.patch(
        `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${booking.flightId}/seats`,
        { seats: booking.noOfSeats, dec: false }
      );
    }
    const resp = await bookingRepository.cancelOldBooking(time);
    return resp;
  } catch (error) {
    throw error;
  }
}

async function getBooking(id) {
  try {
    const booking = await bookingRepository.get(id);
    return booking;
  } catch (error) {
    if (error.statuscode == StatusCodes.NOT_FOUND) {
      throw new AppError("Booking does not exist", error.statuscode);
    }
    throw new AppError(
      "Can not fetch booking",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}
module.exports = {
  createBooking,
  makePayment,
  cancelOldBookings,
  getBooking,
};
