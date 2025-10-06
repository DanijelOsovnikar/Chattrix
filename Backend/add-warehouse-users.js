import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Shop from "./models/shop.model.js";
import User from "./models/user.model.js";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: join(__dirname, "../.env") });

// Migration script to add warehouse users to existing shops
const addWarehouseUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI);
    // console.log("Connected to MongoDB for warehouse user migration");

    // Find all shops that don't have a warehouse user
    const shops = await Shop.find();

    for (const shop of shops) {
      // Check if warehouse user already exists for this shop
      const existingWarehouse = await User.findOne({
        shopId: shop._id,
        role: "warehouse",
      });

      if (existingWarehouse) {
        // console.log(`Warehouse user already exists for shop: ${shop.name}`);
        continue;
      }

      // Create warehouse user for this shop
      let warehouseUserName = `warehouse_${shop.code.toLowerCase()}`;
      const warehousePassword = "warehouse123";

      // Check if username already exists
      const existingUser = await User.findOne({ userName: warehouseUserName });
      if (existingUser) {
        warehouseUserName = `warehouse_${shop.code.toLowerCase()}_${shop._id
          .toString()
          .slice(-4)}`;
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(warehousePassword, salt);

      // Create warehouse user
      const warehouseUser = new User({
        fullName: `${shop.name} Warehouse`,
        userName: warehouseUserName,
        password: hashedPassword,
        shopId: shop._id,
        role: "warehouse",
        permissions: ["send_messages", "receive_messages"],
        isActive: true,
      });

      await warehouseUser.save();
      // console.log(
      //   `Created warehouse user for shop: ${shop.name} (${warehouseUserName})`
      // );
    }

    // console.log("Warehouse users migration completed successfully!");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
    // console.log("Disconnected from MongoDB");
  }
};

// Run migration
addWarehouseUsers().then(() => process.exit(0));
