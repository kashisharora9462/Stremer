import mongoose from "mongoose";
import { User } from "./user.models.js"

const subscriptionSchema = new mongoose.Schema({
    "channel":{
        type: mongoose.Schema.Types.ObjectId,// one to whom user is subscribing
        ref: "User"
    },
    "subscriber":{
        type: mongoose.Schema.Types.ObjectId,// one who is subscribing
        ref: "User"
    }
},
    {
        timestamps: true
    }
)

export const Subscription = mongoose.model("Subscription",subscriptionSchema)