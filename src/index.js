const express = require("express");
const { ServerConfig } = require("./config");
const apiRoutes = require("./routes");
const crons = require("./utils/common/cron-jobs");
const { Queue } = require("./config");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiRoutes);

app.listen(ServerConfig.PORT, async () => {
  console.log(`Server started listening on ${ServerConfig.PORT}`);
  crons();
  await Queue.connectQueue();
});
