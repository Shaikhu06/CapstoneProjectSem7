const jwt = require("jsonwebtoken");
const token = jwt.sign(
  { sub: "user1" },
  process.env.JWT_SECRET || "dev-secret",
  { expiresIn: "1h" }
);
console.log(token);

