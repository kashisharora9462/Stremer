import { ApiError_ } from "../../utils/ApiError_.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Video } from "../models/video.models.js";
import mongoose, { isValidObjectId } from "mongoose";
import { uploadonCloudinary, cloudinary } from "../../utils/cloudinary.js";


const getAllVideos = async (req, res) => {
  try {

    // User should be log
    const userId = req.user?._id;

    // taking values from query
    const { page = 1, limit = 10, query, sortBy } = req.query;

    // check user valid or not
    if (!isValidObjectId(userId)) {
      throw new ApiError_(400, "Invalid user");
    }

    // page and limit should be positive
    if (page <= 0 || limit <= 0) {
      throw new ApiError_(400, "Invalid page or limit");
    }

    // how many records to skip
    const skip = (page - 1) * limit;

    // for search condition
    let filter = {};

    // if user searched something
    if (query) {
      filter.title = { $regex: query, $options: "i" }; 
    }

    // for sorting
    let sort = {};

    // newest videos first
    if (sortBy === "newest") {
      sort.createdAt = -1;
    } 
    // oldest videos first
    else if (sortBy === "oldest") {
      sort.createdAt = 1;
    } 
    // most viewed videos first
    else if (sortBy === "views") {
      sort.views = -1;
    }

    // getting videos from db
    const videos = await Video.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // if no videos found
    if (videos.length === 0) {
      return res.status(200).json(
        new ApiResponse(200, [], "No videos found")
      );
    }

    // sending videos
    return res.status(200).json(
      new ApiResponse(200, videos, "Videos fetched successfully")
    );

  } catch (error) {

    // if something breaks
    return res.status(500).json(
      new ApiResponse(500, null, error.message)
    );

  }
};

const publishVideo = async(req,res) => {
  try {

    // logged in user id
    const userId = req.user?._id

    // getting text data
    const { title, description } = req.body

    // check title & description
    if(title == ""){
      throw new ApiError_(400, "Title is required to upload video")
    }

    // getting file paths
    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    // check video file
    if(!videoLocalPath){
      throw new ApiError_(400, "Video file required")
    }

    // check thumbnail
    if(!thumbnailLocalPath){
      throw new ApiError_(400, "Thumbnail required")
    }

    // upload video
    const videoUploadResponse = await uploadonCloudinary(
      videoLocalPath,
      "VideoFiles"
    )

    // upload thumbnail
    const thumbnailUploadResponse = await uploadonCloudinary(
      thumbnailLocalPath,
      "VideoThumbnail"
    )

    // check upload success
    if(!videoUploadResponse?.secure_url){
      throw new ApiError_(500, "Video upload failed")
    }

    if(!thumbnailUploadResponse?.secure_url){
      throw new ApiError_(500, "Thumbnail upload failed")
    }

    // save video in database
    const video = await Video.create({
      title,
      description,
      videoFile: videoUploadResponse.secure_url,
      thumbnail: thumbnailUploadResponse.secure_url,
      duration: videoUploadResponse.duration,
      owner: userId,
      views: 0,
      isPublished: true
    })

    // send response
    return res.status(201).json(
      new ApiResponse(201, video, "Video published successfully")
    )

  } catch (error) {

    return res.status(500).json(
      new ApiResponse(500, null, error.message)
    )

  }
}

const getVideoById = async(req,res) => {
   try {
     const { videoId } = req.params
 
     if(!videoId){
         throw new ApiError_(400, "Video id required")
     }
     if(!isValidObjectId(videoId)){
         throw new ApiError_(400, "Invalid video id")
     }
     const video = await Video.findById(videoId)
     if(!video){
         throw new ApiError_(400,"Video doesn't exist with this id")
     }
     res.status(200).json(
         new ApiResponse(200,video,"Video Fetched successfully")
     )
   } 
   catch (error) {

        return res.status(500).json(
            new ApiResponse(500, null, error.message)
        )
   }
}

const updateVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!videoId) {
      throw new ApiError_(400, "Video ID required");
    }

    if (!isValidObjectId(videoId)) {
      throw new ApiError_(400, "Invalid video ID");
    }

    // Fetch current video to check old thumbnail
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError_(404, "Video not found");
    }

    // Build update object dynamically
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;

    // Handle thumbnail upload to Cloudinary
    if (req.file && req.file.thumbnail) {
      const filePath = req.file.thumbnail[0].path;

      // Upload new thumbnail
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "thumbnails",
      });

      if(!result){
        throw new ApiError_(400,"Error in uploading thumbnail")
      }

      // Delete old thumbnail from Cloudinary if exists
      if (video.thumbnail) {
        await cloudinary.uploader.destroy(video.thumbnail);
      }

      // Save new thumbnail URL and public_id in DB
      updateFields.thumbnail = result.secure_url;
    }

    if (Object.keys(updateFields).length === 0) {
      throw new ApiError_(400, "At least one field is required to update");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    res.status(200).json(
      new ApiResponse(200, updatedVideo, "Video updated successfully")
    );
  } 
    catch (error) {
        res.status(error.statusCode || 500).json({
        message: error.message || "Internal Server Error",
        });

    }
}

const deleteVideo = async(req,res) => {
    try {
        
    const { videoId } = req.params;

    if (!videoId) {
      throw new ApiError_(400, "Video ID required");
    }

    if (!isValidObjectId(videoId)) {
      throw new ApiError_(400, "Invalid video ID");
    }
    
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError_(404, "Video not found");
    }

    // Delete thumbnail from Cloudinary
    if (video.thumbnail) {
      await cloudinary.uploader.destroy(video.thumbnail);
    }

    // Delete video file from Cloudinary (if you store videos there)
    if (video.videoFile) {
      await cloudinary.uploader.destroy(video.videoFile, { resource_type: "video" });
    }

    await Video.findByIdAndDelete(videoId);

    res.status(200).json(
        new ApiResponse(200,"","Video deleted successfully")
    )
    } 
    catch (error) {
        res.status(error.statusCode || 500).json({
        message: error.message || "Internal Server Error",
        });
    }
}

const togglePublishStatus = async(req,res) => {
    try {
        
        const { videoId } = req.params;

        if(!videoId){
            throw new ApiError_(400,"Video id is required");
        }

        if(!isValidObjectId(videoId)){
            throw new ApiError_(400,"Invalid video id");
        }

        const video = await Video.findById(videoId);

        if(!video){
            throw new ApiError_(404,"Video not found");
        }

        video.isPublished = !video.isPublished;

        await video.save();
        return res.status(200).json(
            new ApiResponse(200,video,"Video publish status toggled successfully")
        )
    } catch (error) {
        res.status(error.statusCode || 500).json({
        message: error.message || "Internal Server Error",
        });
    }

}

export { getAllVideos,publishVideo,getVideoById,updateVideo,deleteVideo,togglePublishStatus };




