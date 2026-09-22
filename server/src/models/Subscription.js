import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: "INR", trim: true, maxlength: 10 },
    renewalDate: { type: Date, required: true },
    billingCycle: { type: String, required: true, enum: ["monthly", "quarterly", "yearly", "custom"] },
    category: { type: String, trim: true, maxlength: 50 },
    notes: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: ["active", "cancelled"], default: "active" },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
