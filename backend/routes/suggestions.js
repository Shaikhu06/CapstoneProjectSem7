// backend/routes/suggestions.js
const express = require("express");
const router = express.Router();

/**
 * POST /api/suggestions
 * body: { category, activity, value, unit }
 * returns array of suggestions (string)
 */
router.post("/", (req, res) => {
  const { category = "", activity = "", value } = req.body;
  const cat = category.toLowerCase();
  const act = activity.toLowerCase();
  const suggestions = [];

  if (cat === "travel") {
    if (
      act.includes("car") ||
      act.includes("petrol") ||
      act.includes("diesel")
    ) {
      if (value <= 3)
        suggestions.push("For short trips (<3km) consider walking or cycling.");
      else
        suggestions.push("Try public transport or carpooling where possible.");
    }
    if (act.includes("bus") || act.includes("rail"))
      suggestions.push("Public transit is already a good low-carbon choice.");
  }

  if (cat === "food") {
    if (
      act.includes("chicken") ||
      act.includes("mutton") ||
      act.includes("beef") ||
      act.includes("fish")
    ) {
      suggestions.push(
        "Try one vegetarian meal each week — it can save several kg CO₂."
      );
    } else if (act.includes("veg"))
      suggestions.push("Great! Keep a veg streak to reduce emissions.");
  }

  if (cat === "shopping") {
    if (value && value > 1000)
      suggestions.push(
        "Consider buying used items or more durable brands to reduce lifecycle emissions."
      );
    suggestions.push("Prefer local and low-packaging products.");
  }

  if (!suggestions.length)
    suggestions.push(
      "No specific suggestion — keep logging to get personalized tips."
    );

  res.json({ suggestions });
});

module.exports = router;
