import { ApiError_ } from "../../utils/ApiError_.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Comment } from "../models/comment.models.js";
import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js"
import mongoose from "mongoose";

const getVideoComments = async(req,res) => {
    try {
        
        const userId = req.user?._id

        const { videoId } = req.params
        let { page=1, limit=10 } = req.query

        page = parseInt(page)
        limit = parseInt(limit)

        if(!videoId) {
            throw new ApiError_(400, "Video ID is required")
        }

        if(!isValidObjectId(videoId)){
            throw new ApiError_(400, "Invalid Video ID")
        }

        if(page<0 || limit<0) {
            throw new ApiError_(400, "Page and limit must be positive integers")
        }

        const video = await Video.findById(videoId)

        if(!video) {
            throw new ApiError_(404, "Video not found")
        }

        const comments = await Comment.aggregate([{
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDetail" 
            }
        },
        {
            $unwind: { 
                path: "$userDetail", 
                preserveNullAndEmptyArrays: true 
            }
        },
        {
            $project: {
                _id : 1,
                content: 1,
                createdAt: 1,
                "userDetail._id": 1,
                "userDetail.username": 1,
                "userDetail.avatar": 1
            }
        },
        {
            $sort: { 
                createdAt: -1 
            }
        },
        {
            $skip: (page - 1) * limit 
        },
        {
            $limit: limit 
        }
        ]);

        const totalComments = comments.length

        res.status(200).json(
            new ApiResponse(200, comments, "Comments fetched successfully")
        )
    } 
    catch (error) {
        return res.status(500).
        json({ success: false, message: error.message });
    }
}

const addComment = async(req,res) => {
    try {
        
        const userId = req.user?._id

        const { videoId } = req.params

        const { content } = req.body

        if(!videoId) {
            throw new ApiError_(400, "Video ID is required")
        }

        if(!isValidObjectId(videoId)){
            throw new ApiError_(400, "Invalid Video ID")
        }

        if(!content || content.trim().length === 0) {
            throw new ApiError_(400, "Comment content cannot be empty")
        }

        const video = await Video.findById(videoId)

        if(!video) {
            throw new ApiError_(404, "Video not found")
        }

        const commentV = await Comment.create({
            video: videoId,
            owner: userId,
            content: content
        })

        res.status(200).json(
            new ApiResponse(200,commentV,"Comment added successfully")
        )
    } 
    catch (error) {
        return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
        });
    }
}

const updateComment = async(req,res) => {
    try {
        
        const userId = req.user?._id
        const { commentId } = req.params
        const { content } = req.body

        if(!commentId){
            throw new ApiError_(400, "Comment ID is required")
        }
        if(!isValidObjectId(commentId)){
            throw new ApiError_(400, "Invalid Comment ID")
        }
        if(!content || content.trim().length==0){
            throw new ApiError_(400, "Comment content cannot be empty")
        }

        const comment = await Comment.findOneAndUpdate(
            { _id: commentId, owner: userId },
            { content: content },
            { new: true }
        )

        if(!comment){
            throw new ApiError_(404, "Comment not found or you are not authorized to update this comment")
        }

        res.status(200).json(
            new ApiResponse(200,comment,"Comment updated successfully")
        )
    } 
    catch (error) {
        return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
        });
    }
}

const deleteComment = async(req,res) => {
    try {
        
        const userId = req.user?._id
        const { commentId } = req.params

        if(!commentId){
            throw new ApiError_(400, "Comment ID is required")
        }   
        if(!isValidObjectId(commentId)){
            throw new ApiError_(400, "Invalid Comment ID")
        }   

        const comment = await Comment.findOneAndDelete(
            { _id: commentId, owner: userId }
        )

        if(!comment){
            throw new ApiError_(404, "Comment not found or you are not authorized to delete this comment")
        }

        res.status(200).json(
            new ApiResponse(200,comment,"Comment deleted successfully")
        )
    } 
    catch (error) {
        return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
        });
    }
}

export { getVideoComments, addComment, updateComment, deleteComment }