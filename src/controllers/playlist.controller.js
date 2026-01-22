import { ApiError_ } from "../../utils/ApiError_.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.models.js";
import mongoose, { isValidObjectId } from "mongoose";



const createPlaylist = async ( req, res )=> {
    // Logic to create a new playlist
    // user should be logged in to create
    // playlist name is required
    // description is optional
    // videos can be added later

    const user = req.user;
    const { name, description } = req.body;

    if(!name || !name.trim()){
        throw new ApiError_(400,"Playlist name is required");
    }

    const newPlaylistOfUser = await Playlist.create({
        name: name.trim(),
        description: description?.trim() || '',
        owner: user._id,
        videos: []
    });

    return res.status(201).
    json(
        new ApiResponse(201,newPlaylistOfUser,"Playlist created successfully")
    )
};

const getUserPlaylists = async ( req, res )=>{
    let userid = req.params.userid;

    if(!userid || !isValidObjectId(userid)){
        throw new ApiError_(400,"Invalid user id");
    }

    const userPlaylist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userid) // converting string to object id
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videosUnderPlaylist"
            }
        },
        {
            $addFields: {
                videosCount: {
                    $size: "$videosUnderPlaylist" 
                }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: "$videosUnderPlaylist",
                createdAt: 1,
                updatedAt: 1,
                videosCount: 1
            }
        }
    ]);

    return res.status(200).
    json(
        new ApiResponse(200,userPlaylist,"User playlists fetched successfully")
    )}

    const getPlaylistById = async ( req, res )=>{
        const { playlistId } = req.params;

        if(!playlistId || !isValidObjectId(playlistId)){ // playlist id exist and is valid object id then only fetch playlist
            throw new ApiError_(400,"Invalid playlist id");
        }

        const playlist = await Playlist.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    let: { videoIds: "$videos" },
                    pipeline: [
                                {
                                    $match: {
                                        $expr: { $in: ["$_id", "$$videoIds"] }
                                    }
                                    },
                                {
                                    $project: {
                                        title: 1,
                                        description: 1,
                                        thumbnail: 1,
                                        duration: 1,
                                        views: 1
                                    }
                                }
                            ],
                            as: "videosUnderPlaylist"
                            }
            },
            {
                $addFields: {
                    videosCount: {
                        $size: "$videosUnderPlaylist"
                    }
                }   
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    videos: "$videosUnderPlaylist",
                    createdAt: 1,
                    updatedAt: 1,
                    videosCount: 1
                }
            }
        ]);

        if(!playlist.length){
            throw new ApiError_(404,"Playlist not found");
        }

        return res.status(200).
        json(
            new ApiResponse(200,playlist[0],"Playlist fetched successfully")
        )
    }

    const addVideoToPlaylist = async ( req, res )=>{
        // only owner of playlist can add video to playlist
        const user = req.user;
        const { playlistId } = req.params;
        const { videoId } = req.body;

        if(!playlistId || !isValidObjectId(playlistId)){
            throw new ApiError_(400,"Playlist does not exists of given id");
        }

        if(!videoId || !isValidObjectId(videoId)){
            throw new ApiError_(400,"Invalid video id");
        }

        const findPlaylist = await Playlist.findById(playlistId);

        if(!findPlaylist){
            throw new ApiError_(404,"Playlist not found");
        }

        if(findPlaylist.owner.toString() !== user._id.toString()){
            throw new ApiError_(403,"You are not authorized to add video to this playlist");
        }

        const isVideoAlreadyInPlaylist = findPlaylist.videos.includes(videoId);

        if(isVideoAlreadyInPlaylist){
            throw new ApiError_(400,"Video is already in playlist");
        }

        findPlaylist.videos.push(videoId);
        await findPlaylist.save();

        return res.status(200).
        json(
            new ApiResponse(200,findPlaylist,"Video added to playlist successfully")
        )
    }

    const removeVideoFromPlaylist = async ( req, res )=>{
        // only owner of playlist can remove video from playlist
        const user = req.user;
        const { playlistId } = req.params;
        const { videoId } = req.body;

        if(!playlistId || !isValidObjectId(playlistId)){
            throw new ApiError_(400,"Playlist does not exists of given id");
        }

        if(!videoId || !isValidObjectId(videoId)){
            throw new ApiError_(400,"Invalid video id");
        }

        const PlaylistToUpdate = await Playlist.findById(playlistId);

        if(!PlaylistToUpdate){
            throw new ApiError_(404,"Playlist not found");
        }

        if(PlaylistToUpdate.owner.toString() !== user._id.toString()){
            throw new ApiError_(403,"You are not authorized to remove video from this playlist");
        }

        const isVideoInPlaylist = PlaylistToUpdate.videos.includes(videoId);

        if(!isVideoInPlaylist){
            throw new ApiError_(400,"Video is not in playlist");
        }

        PlaylistToUpdate.videos = PlaylistToUpdate.videos.filter(
            (vidId) => vidId.toString() !== videoId.toString()
        );

        await PlaylistToUpdate.save();

        return res.status(200).
        json(
            new ApiResponse(200,PlaylistToUpdate,"Video removed from playlist successfully")
        )
    }

    const deletePlaylist = async ( req, res )=>{
        const { playlistId } = req.params

        if(!playlistId || !isValidObjectId(playlistId)){
            throw new ApiError_(400,"Playlist id is invalid")
        }

        const deletePlaylist = await Playlist.findByIdAndDelete(playlistId)

        if(!deletePlaylist){
            throw new ApiError_(404,"Playlist not found")
        }

        return res.status(200).
        json(
            new ApiResponse(200,deletePlaylist,"Playlist deleted successfully")
        )
    }

    const updatePlaylistDetails = async(req,res)=> {
        const { playlistId } = req.params
        const { name, description } = req.body

        if(!playlistId || isValidObjectId(playlistId)){
            throw new ApiError_(400,"Playlist id is invalid")
        }

        if(!name && !description){
            throw new ApiError_(400,"Nothing to update")
        }

        const playlist = await Playlist.findById(playlistId);

        if(!playlist){
            throw new ApiError_(404,"Playlist not found")
        }

        const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
            $set: {
                name: name?.trim() || playlist.name,
                description: description?.trim() || playlist.description
            }
        }, 
        { 
            new: true 
        });

        return res.status(200).
        json(
            new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
        );
    }

export { createPlaylist, getUserPlaylists, getPlaylistById, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylistDetails };
