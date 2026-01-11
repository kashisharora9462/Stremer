import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { DB_NAME } from "./constants.js";
import app from "./app.js";


dotenv.config({ path: './.env' });

connectDB().then( () => {
    app.on("error", (err) => {
        console.error("Server error:", err);
    });
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });

}).catch( (error) => { 
    //error in connection to videosdatabase videosdb
    console.error("Database connection failed in index.js:", error);
});
