import { ApiError_ } from "../../utils/ApiError_.js";
import { User } from "../models/user.models.js";
import { uploadonCloudinary } from "../../utils/cloudinary.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const registerUser = async (req,res) =>{
    // Registration logic here
    //steps
    //get user details from frontend
    //validate user details (not empty)
    //check if user already exists
    //check for images, check for avatar image
    //upload them to cloudinary for storing
    //create user object - create entry in db
    //remove password and refresh token from response of user object sent to frontend
    //check for user creation done successfully or failure
    //return response to frontend

    const { fullname, email, username, password } = req.body;
    console.log("Registering user:", { email, username });

    if(!fullname || !email || !username || !password){
        throw new ApiError_(400,"All fields are required for registration");
    }


    const existiedUser = await User.findOne({
        $or: [
            { email },
            { username }
        ]
    })

    if(existiedUser){
        throw new ApiError_(409,"User with given email or username already exists");
    }

    console.log("File received:", req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;// optional chaining to avoid error if no file is uploaded
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError_(400,"Avatar image is required");
    }


    const avatarImageUploadResponse = await uploadonCloudinary(avatarLocalPath, "UserAvatars");
    const coverImageUploadResponse = coverImageLocalPath ? await uploadonCloudinary(coverImageLocalPath, "UserCoverImages") : null;

    if(!avatarImageUploadResponse?.secure_url){
        throw new ApiError_(500,"Error in uploading avatar image to cloudinary");
    }

    const newUser = await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatarImageUploadResponse.url,
        coverImage: coverImageUploadResponse.url || ""
    })

    if(User.findById(newUser._id)){
        throw new ApiError_(500,"Error in creating user");
    }

    newUser.password= undefined;
    newUser.refreshToken= undefined;

    return res.status(201).json(
        new ApiResponse(200,newUser,"User registered successfully")
    );
}


export {registerUser};