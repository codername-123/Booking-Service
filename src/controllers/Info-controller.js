const { StatusCodes } = require("http-status-codes");
function Info(req, res) {
  res
    .status(StatusCodes.OK)
    .json({
      success: true,
      message: "Booking Service API is live",
      error: {},
      data: {},
    });
}

module.exports = { Info };
