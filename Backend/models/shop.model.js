import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    contactInfo: {
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
    },
    settings: {
      allowCrossShopCommunication: {
        type: Boolean,
        default: false,
      },
      maxUsers: {
        type: Number,
        default: 100,
      },
      timezone: {
        type: String,
        default: "Europe/Belgrade",
      },
    },
    // Warehouses this shop can communicate with for cross-shop requests
    assignedWarehouses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    adminUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Index for faster queries
shopSchema.index({ code: 1 });
shopSchema.index({ name: 1 });
shopSchema.index({ isActive: 1 });

const Shop = mongoose.model("Shop", shopSchema);

export default Shop;
