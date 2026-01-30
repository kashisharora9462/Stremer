import { ApiError_ } from "../../utils/ApiError_.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Like } from "../models/like.models.js";
import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js"
import mongoose from "mongoose";

const toggleVideoLike = async(req,res) => {
    try {
        
        const userId = req.user?._id

        const { videoId } = req.params

        if(!videoId) {
            throw new ApiError_(400, "Video ID is required")
        }

        if(!isValidObjectId(videoId)) {
            throw new ApiError_(400, "Invalid Video ID")
        }

        // if video exist or not

        const video = Video.findById(videoId)

        if(!videoId) {
            throw new ApiError_(404, "Video not found")
        }

        // check liked or not
        const existingLike = await Like.findOne({
            video : videoId,
            likedBy: userId
        })

        if(existingLike) {
            // remove like
            await Like.findByIdAndDelete(existingLike._id)
            return res.status(200).json(
                new ApiResponse(200, { Liked : false }, "Unliked Video")
            )
        }
        else {
            // like video
            await Like.create({
                video: videoId,
                likedBy: userId
            })

            return res.status(200).json(
                new ApiResponse(200, { Liked : true }, "Liked Video")
            )
        }
    } 
    catch (error) {
        return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
        });
    }

}

const toggleCommentLike = async(req,res) => {
    try {
        
        const userId = req.user?._id

        const { commentId } = req.params

        if(!commentId) {
            throw new ApiError_(400, "Comment ID is required")
        }

        if(!isValidObjectId(commentId)) {
            throw new ApiError_(400, "Invalid Comment ID")
        }

        // check liked or not
        const existingLike = await Like.findOne({
            comment : commentId,
            likedBy: userId
        })

        if(existingLike) {
            // remove like
            await Like.findByIdAndDelete(existingLike._id)
            return res.status(200).json(
                new ApiResponse(200, { Liked : false }, "Unliked Comment of User")
            )
        }
        else {
            // like video
            await Like.create({
                comment: commentId,
                likedBy: userId
            })

            return res.status(200).json(
                new ApiResponse(200, { Liked : true }, "Liked Comment of User")
            )
        }
    } 
    catch (error) {
        return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
        });
    }

}

const toggleTweetLike = async(req,res) => {
    try {
        
        const userId = req.user?._id
        
        const { tweetId } = req.params

        if(!tweetId) {
            throw new ApiError_(400, "Tweet ID is required")
        }

        if(!isValidObjectId(tweetId)) {
            throw new ApiError_(400, "Invalid Tweet ID")
        }

        // check liked or not
        const existingLike = await Like.findOne({
            tweet : tweetId,
            likedBy: userId
        })

        if(existingLike) {
            // remove like
            await Like.findByIdAndDelete(existingLike._id)
            return res.status(200).json(
                new ApiResponse(200, { Liked : false }, "Unliked Tweet")
            )
        }
        else {
            // like video
            await Like.create({
                tweet: tweetId,
                likedBy: userId
            })

            return res.status(200).json(
                new ApiResponse(200, { Liked : true }, "Liked Tweet")
            )
        }
    } 
    catch (error) {
        return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
        });
    }

}

const getLikedVideos = async(req,res) => {
    try {
        
        const userId = req.user?._id

        const likedVideos = await Like.aggregate([
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(userId),
                    video: { $ne: null }
                }
            },
            {
                $lookup: {  
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videoDetails"
                }
            },  
            {
                $unwind: "$videoDetails"
            },
            {
                $project: {
                    "videoDetails.__v": 0,
                    "videoDetails.createdAt": 0,
                    "videoDetails.updatedAt": 0
                }
            }
        ])

        return res.status(200).json(
            new ApiResponse(200, likedVideos, "Liked Videos fetched successfully")
        )
    } catch (error) {
        return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
        });
    }

}

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos }



