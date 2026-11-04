import mongoose from "mongoose";
import dns from "dns";

// Some ISPs fail MongoDB Atlas "mongodb+srv://" lookups. Using public resolvers
// fixes that. Set DNS_SERVERS=system to keep the operating system resolver
// (e.g. inside a corporate network or Docker with a custom DNS).
if (process.env.DNS_SERVERS !== "system") {
  dns.setServers(
    (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1").split(",").map((s) => s.trim())
  );
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
