import mongoose from "mongoose";

// Define the user schema inline since we're not in the main app context
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["employee", "warehouseman", "admin", "super_admin"],
      default: "employee",
    },
    permissions: {
      type: [String],
      enum: [
        "send_messages",
        "admin_panel",
        "manage_users",
        "view_all_users",
        "manage_shops",
        "view_cross_shop",
        "receive_messages",
        "update_status",
        "view_employees",
      ],
      default: ["send_messages"],
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    pushSubscription: { type: Object, default: null },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

async function promoteUserToAdmin() {
  try {
    // Connect to database directly
    await mongoose.connect("mongodb://localhost:27017/gigaapp");
    // console.log("Connected to MongoDB");

    // First, let's see all users
    const allUsers = await User.find({}).populate("shopId", "name");

    // console.log("\n=== ALL USERS ===");
    allUsers.forEach((user) => {
      // console.log(`ID: ${user._id}`);
      // console.log(`Name: ${user.fullName}`);
      // console.log(`Username: ${user.username}`);
      // console.log(`Role: ${user.role}`);
      // console.log(`Shop: ${user.shopId ? user.shopId.name : "No shop"}`);
      // console.log(`Permissions: ${user.permissions.join(", ")}`);
      // console.log("---");
    });

    // Find "Test Danijel" user
    const testUser = await User.findOne({
      $or: [
        { fullName: { $regex: /test.*danijel/i } },
        { username: { $regex: /test.*danijel/i } },
      ],
    });

    if (!testUser) {
      // console.log('\n❌ User "Test Danijel" not found');
      return;
    }

    // console.log(`\n📋 Found user: ${testUser.fullName} (${testUser.username})`);
    // console.log(`Current role: ${testUser.role}`);
    // console.log(`Current permissions: ${testUser.permissions.join(", ")}`);

    // Promote to admin with appropriate permissions
    const adminPermissions = [
      "send_messages",
      "admin_panel",
      "manage_users",
      "view_all_users",
    ];

    const updatedUser = await User.findByIdAndUpdate(
      testUser._id,
      {
        role: "admin",
        permissions: adminPermissions,
      },
      { new: true, runValidators: true }
    ).populate("shopId", "name");

    // console.log("\n✅ User successfully promoted to admin!");
    // console.log(`New role: ${updatedUser.role}`);
    // console.log(`New permissions: ${updatedUser.permissions.join(", ")}`);
  } catch (error) {
    console.error("❌ Error promoting user:", error);
  } finally {
    mongoose.connection.close();
    // console.log("\n🔌 Database connection closed");
  }
}

// Run the script
promoteUserToAdmin();
