import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { Like } from "../models/like.models.js"
import { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos } from "../controllers/like.controller.js"

const router = Router();

router.use(verifyJWT)

router.route("/toggle/v/:videoId").post(toggleVideoLike)
router.route("/toggle/c/:videoId").post(toggleCommentLike)
router.route("/toggle/t/:videoId").post(toggleTweetLike)
router.route("/Likedvideos").get(getLikedVideos)

export default router




