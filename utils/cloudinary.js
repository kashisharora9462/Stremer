import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';// file system module to handle file operations in nodejs like reading,writting,deleting files etc.
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

cloudinary.config( {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
} );

const uploadonCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath){
            return null;
        }
        const result = await cloudinary.uploader.upload(localFilePath, {    
            resource_type: 'auto' 
        } );
        // after uploading the file to cloudinary we can delete the local file to save space on server.
        console.log("Cloudinary upload result:", result);
        fs.unlinkSync(localFilePath);
        return result.secure_url;// return the cloudinary url of uploaded file.
    }
    catch(error){
        fs.unlinkSync(localFilePath);// remove locally saved file as upload on cloudinary has failed.
        return null;    
    }
};

export { uploadonCloudinary };