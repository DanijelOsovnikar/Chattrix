import mongoose from "mongoose";
import dotenv from "dotenv";
import Shop from "./models/shop.model.js";
import User from "./models/user.model.js";
import Message from "./models/message.js";
import Conversation from "./models/conversation.js";

dotenv.config();

// Migration script to add shop support to existing data
const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI);
    // console.log("Connected to MongoDB for migration");

    // Step 1: Create a default shop for existing data
    let defaultShop = await Shop.findOne({ code: "DEFAULT" });

    if (!defaultShop) {
      defaultShop = new Shop({
        name: "Default Shop",
        code: "DEFAULT",
        address: "Main Location",
        contactInfo: {
          email: "admin@example.com",
          phone: "+1234567890",
        },
        settings: {
          allowCrossShopCommunication: true,
          maxUsers: 1000,
        },
      });

      await defaultShop.save();
      // console.log("Created default shop:", defaultShop.name);
    }

    // Step 2: Update existing users to have shopId and role
    const usersWithoutShop = await User.find({
      $or: [{ shopId: { $exists: false } }, { shopId: null }],
    });

    if (usersWithoutShop.length > 0) {
      // console.log(
      //   `Found ${usersWithoutShop.length} users without shop. Updating...`
      // );

      for (const user of usersWithoutShop) {
        // Assign default role based on existing logic or patterns
        let role = "employee";
        let permissions = ["send_messages"];

        // Check if user was an admin based on the old hardcoded IDs
        const oldAdminIds = [
          "674303f38438fe8ab0a05c38",
          "67412f99c9e8d92cc7b7f7ed",
          "674498bf4bb9eaf2351c45b2",
          "67412fc1c9e8d92cc7b7f7f3",
          "67412fe4c9e8d92cc7b7f7fa",
        ];

        if (oldAdminIds.includes(user._id.toString())) {
          role = "admin";
          permissions = [
            "view_all_users",
            "manage_users",
            "send_messages",
            "admin_panel",
          ];
        }

        // Special handling for the main admin user
        if (user._id.toString() === "67412fe4c9e8d92cc7b7f7fa") {
          role = "super_admin";
          permissions = [
            "view_all_users",
            "manage_users",
            "send_messages",
            "admin_panel",
            "manage_shops",
            "view_cross_shop",
          ];
        }

        await User.findByIdAndUpdate(user._id, {
          shopId: defaultShop._id,
          role: role,
          permissions: permissions,
          isActive: true,
        });

        // console.log(`Updated user ${user.fullName} with role ${role}`);
      }
    }

    // Step 3: Update existing messages to have shopId
    const messagesWithoutShop = await Message.find({
      $or: [{ shopId: { $exists: false } }, { shopId: null }],
    });

    if (messagesWithoutShop.length > 0) {
      // console.log(
      //   `Found ${messagesWithoutShop.length} messages without shop. Updating...`
      // );

      await Message.updateMany(
        {
          $or: [{ shopId: { $exists: false } }, { shopId: null }],
        },
        { shopId: defaultShop._id }
      );
    }

    // Step 4: Update existing conversations to have shopId
    const conversationsWithoutShop = await Conversation.find({
      $or: [{ shopId: { $exists: false } }, { shopId: null }],
    });

    if (conversationsWithoutShop.length > 0) {
      // console.log(
      //   `Found ${conversationsWithoutShop.length} conversations without shop. Updating...`
      // );

      await Conversation.updateMany(
        {
          $or: [{ shopId: { $exists: false } }, { shopId: null }],
        },
        {
          shopId: defaultShop._id,
          isActive: true,
        }
      );
    }

    // console.log("Migration completed successfully!");
    // console.log("\nNext steps:");
    // console.log(
    //   "1. Update your frontend to handle shopId in user authentication"
    // );
    // console.log("2. Update SocketContext.jsx to use dynamic shop rooms");
    // console.log("3. Test the application with the new multi-shop architecture");
    // console.log(
    //   "4. Create additional shops as needed using the /api/shops endpoints"
    // );
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
    // console.log("Disconnected from MongoDB");
  }
};

// Run migration if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  migrate().then(() => process.exit(0));
}

export default migrate;
