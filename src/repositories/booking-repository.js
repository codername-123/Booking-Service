const { StatusCodes } = require("http-status-codes");

const { Booking } = require("../models");
const CrudRepository = require("./crud-repository");
const { Op } = require("sequelize");
const { Enums } = require("../utils/common");
const { BOOKED, CANCELLED } = Enums.BOOKING_STATUS;

class BookingRepository extends CrudRepository {
  constructor() {
    super(Booking);
  }

  async createBooking(data, transaction) {
    const response = await this.model.create(data, {
      transaction: transaction,
    });
    return response;
  }

  async update(id, data, transaction) {
    const airplaneAttributes = Object.keys(this.model.rawAttributes);
    const dataKeys = Object.keys(data);
    const hasAttributes = dataKeys.every((datakey) =>
      airplaneAttributes.includes(datakey)
    );
    if (hasAttributes) {
      const response = await this.model.update(
        data,
        {
          where: {
            id: id,
          },
        },
        { transaction: transaction }
      );
      if (!response[0]) {
        throw new AppError(
          "Not able to find the resource",
          StatusCodes.NOT_FOUND
        );
      }
      return response;
    } else {
      throw new AppError(
        "column to be updated is not found",
        StatusCodes.NOT_FOUND
      );
    }
  }

  async cancelOldBooking(timeStamp) {
    try {
      const response = await Booking.update(
        { status: CANCELLED },
        {
          where: {
            [Op.and]: [
              {
                createdAt: {
                  [Op.lt]: timeStamp,
                },
              },
              {
                status: {
                  [Op.ne]: BOOKED,
                },
              },
              {
                status: {
                  [Op.ne]: CANCELLED,
                },
              },
            ],
          },
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getOldBookings(timeStamp) {
    try {
      const bookings = await Booking.findAll({
        where: {
          [Op.and]: [
            {
              createdAt: {
                [Op.lt]: timeStamp,
              },
            },
            {
              status: {
                [Op.ne]: BOOKED,
              },
            },
            {
              status: {
                [Op.ne]: CANCELLED,
              },
            },
          ],
        },
      });
      return bookings;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = BookingRepository;
