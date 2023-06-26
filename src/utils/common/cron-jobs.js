const cron = require("node-cron");
const { BookingService } = require("../../services");

function scheduleCrons() {
  cron.schedule("* */20 * * * *", async () => {
    await BookingService.cancelOldBookings();
  });
}

module.exports = scheduleCrons;
