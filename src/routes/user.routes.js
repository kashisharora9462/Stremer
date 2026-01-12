import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();// create new router instance.routes mean endpoints of the api like GET /api/login,/api/register,/api/profile.

router.route("/register").post( registerUser);// defining route for user registration. When a POST request is made to /register endpoint, the registerUser controller function will be called to handle the request.

export default router;// default mean when we import this file we can give any name to the imported object.



