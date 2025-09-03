import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localfilepath) => {
  try {
    if(!localfilepath) return;

    const response = await cloudinary.uploader.upload(localfilepath, {
      resource_type: 'image'
    })

    fs.unlinkSync(localfilepath);
    return response;
  } catch (error) {
    fs.unlinkSync(localfilepath);
    throw new Error(error.message);
  }
}

export { uploadOnCloudinary };