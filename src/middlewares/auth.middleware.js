import { User } from "../models/user.models.js"
import jwt from "jsonwebtoken"
import { ApiResponse } from "../../utils/ApiResponse.js"
import { ApiError_ } from "../../utils/ApiError_.js";

const verifyJWT = async ( req, res, next )=>{
    try{
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");

        if(!accessToken){
            throw new ApiError_(400,"Unauthorized request")
        }
        const decodedToken = await jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET);

        if(!decodedToken){
            throw new ApiError_("Unauthorized token")
        }

        const user = await User.findById(decodedToken._id).select("-password -refreshToken")  //since access token defination contain _id in payload section while creating jwt.

        if(!user){
            throw new ApiError_("Invalid access token");
        }

        req.user = user;

        next();


    }
    catch(error){
        throw new ApiError_(401,error);
    }

}

export { verifyJWT };
