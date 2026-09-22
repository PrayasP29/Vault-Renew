import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    originalName: { type: String, required: true, trim: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    status: { type: String, enum: ["uploaded", "processing", "processed", "failed"], default: "uploaded" },
  },
  { timestamps: true }
);

const Upload = mongoose.model("Upload", uploadSchema);
export default Upload;
