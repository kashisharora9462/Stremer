import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//Whenever use middleware or configurations, use app.use() to apply it in the express app
app.use(cors(
    Options = {
        origin: '*'
}));

//parse mean convert the incoming data to usable format .Parsing is done using middleware in express

app.use(express.json({limit: '16kb'})); //middleware to parse json data in request body
app.use(cookieParser()); //middleware to parse cookies from request header
app.use(express.urlencoded({ extended: true })); //configuration to parse urlencoded data
app.use(express.static('public')); //to serve static files like images,css from public folder


export default app;