import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();// create new router instance.routes mean endpoints of the api like GET /api/login,/api/register,/api/profile.

router.route("/register").post( 
    //middleware to handle file uploads for avatar and cover images used after request method eg post because we are uploading files along with other form data.
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    registerUser);// defining route for user registration. When a POST request is made to /register endpoint, the registerUser controller function will be called to handle the request.

router.route("/login").post(loginUser);

route.route("/logout").post(
    verifyJWT,
    logoutUser)

export default router;// default mean when we import this file we can give any name to the imported object.



