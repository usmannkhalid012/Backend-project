 import { v2 as cloudinary } from "cloudinary";
 import fs from "fs";
 
 
 cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
 });
 const uploadOnCloudinary = async (filePath) => {
    try {
        if (!LocalFilePath) return null;
       const response = await cloudinary.uploader.upload(filePath, {
          resource_type: "auto",
        });
      console.log("Cloudinary upload result:", response.url) ; 
      return response;
    } catch (error) {
        fs.unlinkSync(LocalFilePath);//remove the file from local storage after uploading to cloudinary
        return null;

    }
 } 