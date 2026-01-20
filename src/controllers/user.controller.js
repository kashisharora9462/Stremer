import { ApiError_ } from "../../utils/ApiError_.js";
import { User } from "../models/user.models.js";
import { uploadonCloudinary } from "../../utils/cloudinary.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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

const changeCurrentPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPassweordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError_(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    user.password = undefined;
    user.refreshToken = undefined;

    return res.status(200).json(
        new ApiResponse(200, {}, "Password changed successfully")
    );
}

const getCurrentUser = async(req,res)=>{
    const user = req.user; 
    if (!user) { 
        throw new ApiError(404, "User not found"); 
    }

    return res.status(200).
    json(new ApiResponse(200, user, "User fetched successfully"));

}

const updateAccountDetails = async (req, res) => {
    const { fullName, username } = req.body;

    // 1. At least one field required
    if (!fullName && !username) {
        throw new ApiError(400, "At least one field is required to update");
    }

    // 2. Prevent duplicate username
    if (username) {
        const existingUser = await User.findOne({
            username,
            _id: { $ne: req.user._id }
        });

        if (existingUser) {
            throw new ApiError(409, "Username already taken");
        }
    }

    const updateFields = {};
    if (fullName) updateFields.fullName = fullName;
    if (username) updateFields.username = username;

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateFields },
        { new: true }
    ).
    select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }


    return res.status(200).json(
        new ApiResponse(
            200,
            updatedUser,
            "Profile updated successfully"
        )
    );
};

const updateUserAvatar = async(req,res)=>{
    const avatarLocalPath = req?.file?.path;

    if(!avatarLocalPath){
        throw new ApiError_(400, "Avatar is missing");
    }

    const newavatar = await uploadonCloudinary(avatarLocalPath);

    if(!newavatar.url){
        throw new ApiError_(500, "Error while uploading to cloudinary");
    }


    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {avatar: newavatar.url},
        },
        {
            new: true
        }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200,{},"Avatar image is updated")
    );

}

const updateUserCoverImage = async(req,res)=>{
    const coverImageLocalPath = req?.file?.path;
    
    if(!coverImageLocalPath){
        throw new ApiError_(400, "Cover image is missing"); 
    } 

    const newCoverImage = await uploadonCloudinary(coverImageLocalPath);
    
    if(!newCoverImage.url){ 
        throw new ApiError_(401, "Error while uploading to cloudinary"); 
    } 
    

    const user = await User.findByIdAndUpdate( req.user._id,
        { 
            $set: {coverImage: newCoverImage.url}, 
        }, 
        { 
            new: true 
        } ).select("-password -refreshToken"); 
        
        res.status(200).json( new ApiResponse(200, user, "Cover image is updated") ); 
    }

const getUserChannelProfile = async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError_(400, "Username is missing");
    }

    const channelInfo = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [
                                req.user?._id,
                                "$subscribers.subscriber"
                            ]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ]);

    if (!channelInfo.length) {
        throw new ApiError_(404, "Channel not found");
    }

    return res.status(200).
    json(
        new ApiResponse(200,channelInfo[0]));
};

const getUserWatchHistory = async(req,res)=>{
    const userid = user?._id;

    if(userid){
        throw new ApiError_(400, "User ID is missing");
     } 

     const watchHistory = User.aggregate( [ {
        $match: {
            _id: new mongoose.Types.ObjectId(userid)
        }
     },
    {
        $lookup: {
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "OwnerOfVideo",
                        pipeline: [
                            {
                                $project: {
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }
                        ]
                    },
    
                    $addFields: {
                        owner: {
                            $first: "$OwnerOfVideo"
                        }
                    } 
                }
            ]
        }
    }
])

    return res.status(200).
    json(
        new ApiResponse(200,user[0].watchHistory,"Watch history fetched of User")
    )
};


export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getUserChannelProfile,getUserWatchHistory};