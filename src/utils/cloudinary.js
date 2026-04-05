import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) return null;

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    await fs.unlink(localFilePath); // delete temp file
    return response.secure_url || response.url;

  } catch (error) {
    console.error("Cloudinary upload error:", error);
    try {
      await fs.unlink(localFilePath); // cleanup even on error
    } catch {}
    return null;
  }
};

export { uploadOnCloudinary };