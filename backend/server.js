import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

// Connect to DB first
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});