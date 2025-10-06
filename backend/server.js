// backend/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// routes
const activityRouter = require("./routes/activity");
app.use("/api", activityRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Server running on", PORT));
