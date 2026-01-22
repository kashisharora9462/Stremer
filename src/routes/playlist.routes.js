import { Router } from "express";
import { getPlaylistById, getUserPlaylists, createPlaylist, deletePlaylist, updatePlaylistDetails, addVideoToPlaylist, removeVideoFromPlaylist } from "../controllers/playlist.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import multer from "multer";

const router = Router();

router.use(verifyJWT); // Apply JWT verification middleware to all routes in this router

router.route("/").post( // "/" is default route for creating playlist
    createPlaylist
);

router.route("/user/:userid").get(
    getUserPlaylists
);

router.route("/addVideos/:playlistId").post(
    addVideoToPlaylist
);

router.route("/:playlistId").get(
    getPlaylistById
);

router.route("/remove-video/:playlistId").delete(
    removeVideoFromPlaylist
);

router.route("/delete-playlist/:playlistId").delete(
    deletePlaylist
);

router.route("/update-playlist-details/:playlistId").patch(
    updatePlaylistDetails
);

export default router;