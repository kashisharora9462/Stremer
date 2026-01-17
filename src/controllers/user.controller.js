import { ApiError_ } from "../../utils/ApiError_.js";
import { User } from "../models/user.models.js";
import { uploadonCloudinary } from "../../utils/cloudinary.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    
    try{

        const user = await User.findById(userId);

        if(!user){
            throw new ApiError_(404, "User not found while generating json web token");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });// save only refresh token in database.ValidateBeforeSave because we dont want to validate.

        return { accessToken, refreshToken };
    }
    catch(error){
        throw new ApiError_(500,"Internal server error while generating json web token");
    }
}
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
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
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

    if(!newUser){
        throw new ApiError_(500,"Error in creating user");
    }

    newUser.password= undefined;
    newUser.refreshToken= undefined;

    return res.status(201).json(
        new ApiResponse(200,newUser,"User registered successfully")
    );
}

const loginUser = async (req,res) =>{
    // take email and password from user 
    // validate if not empty
    // check if user exists in database with this email
    // if user exists then compare password with hashed password stored in db by bcrypt compare
    // if password match then generate jwt access token and refresh token
    // store refresh token in db against user
    // return response to frontend with access token and refresh token

    const {email,password} = req.body;

    if(!email){
        throw new ApiError_(400,"Email is required");
    }

    if(!password){
        throw new ApiError_(400,"Password is required");
    }

    const existingUser = await User.findOne({email});

    if(!existingUser){
        throw new ApiError_(404,"User with given email does not exist");
    }

    const checkPassword = await existingUser.isPassweordCorrect(password);

    if(!checkPassword){
        throw new ApiError_(401,"Password is incorrect");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(existingUser._id);

    const loggedInUser = await User.findById(existingUser._id).select("-password -refreshToken");


    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )

}

const logoutUser = async (req,res)=> {
    const id= req.user?._id;

    await User.findByIdAndUpdate(id,
        {
            $set :{ refreshToken: undefined }
        },
        {
            new :true
        }
    )

    const options= {
        httpOnly: true,
        secure: true
    }

    console.log("Logged out successfully")

    res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).
    json(new ApiResponse(200, {}, "User logged out successfully yay "));


}

const refreshAccessToken = async (req,res)=>{
    // when access token expire we generate refresh token

    const incomingRefreshToken = req.cookie?.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError_(401,"Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        if(!decodedToken){
            throw new ApiError_(401,"Unauthorized token");
        }
    
        const user = await User.findById(decodedToken._id);
    
        if(!user){
            throw new ApiError_(401,"Invalid refresh token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError_(401,"Refresh Token is expired or used");
        }
    
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshToken(decodedToken._id);
    
        const options ={
            httpOnly: true,
            secure: true
        }
        return res.status(201).cookie("accessToken",accessToken,options).cookie("refreshToken",newrefreshToken,options).
        json(
            new ApiResponse(201,
                {
                    accessToken, refreshToken: newrefreshToken
                },
                "Access token refreshed"
            )
        )
    } 
    catch (error) {
        throw new ApiError_(401,error);// error in generating new access token.
    }

}
    

export {registerUser, loginUser, logoutUser, refreshAccessToken};