// backend/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// routes
const activityRouter = require("./routes/activity");


const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Carbon Tracker backend — visit /health or /api/emission-factors");
});

app.get('/health', (req, res)=>res.json({status:'ok'}))

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  // Chrome/DevTools probe — reply small valid JSON
  return res.json({ status: "ok" });
});

app.use("/api", activityRouter);

app.use(express.static(path.join(__dirname, "..", "frontend", "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "build", "index.html"));
});

// app.use((req, res, next) => {
//   res.status(404).json({ error: "Not Found", path: req.originalUrl });
// });


// app.use((req, res, next) => {
//   res.setHeader(
//     "Content-Security-Policy",
//     "default-src 'self'; connect-src 'self' http://localhost:4000 http://127.0.0.1:4000; script-src 'self' 'unsafe-inline'; img-src 'self' data:;"
//   );
//   next();
// });



// keep the catch all added earlier

app.use((req, res) =>
  res.status(404).json({ error: "Not Found", path: req.originalUrl })
);



const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Server running on", PORT));
