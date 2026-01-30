import { isValidObjectId } from "mongoose";
import { ApiError_ } from "../../utils/ApiError_.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.models.js"
import mongoose from "mongoose";

const getUserChannelSubscribers = async (req, res) => {
  try {
    const { channelId } = req.params;

    if (!channelId) {
      throw new ApiError_(400, "Channel id is required");
    }

    if (!isValidObjectId(channelId)) {
      throw new ApiError_(400, "Invalid channel id");
    }

    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId)
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscriber"
        }
      },
      { $unwind: "$subscriber" },
      {
        $project: {
          _id: 0,
          "subscriber.password": 0,
          "subscriber.refreshToken": 0,
          "subscriber.__v": 0
        }
      }
    ]);

    const totalSubscribers = subscribers.length;

    console.log("AGG RESULT:", subscribers);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalSubscribers,
          subscribers
        },
        "All subscribers fetched successfully"
      )
    );

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch subscribers"
    });
  }
};

const getChannelSubscribedByUser = async(req,res) => {
    try {

        const { subscriberId } = req.params

        if (!subscriberId) {
            throw new ApiError_(400, "Subsciber id is required");
        }

        if(!isValidObjectId(subscriberId)){
            throw new ApiError_(400, "Invalid subscriber id");
        }

        const subscribedChannels = await Subscription.aggregate([{
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "Subscribed"
            }
        },
        {
            $unwind: "$Subscribed"
        },
        {
            $project: {
                "Subscribed.password": 0,
                "Subscribed.refreshToken": 0,
                "Subscribed.__v": 0
                }
        }
    ])

    const totalChannels = subscribedChannels.length


    res.status(200).json(
        new ApiResponse(200,
                    { 
                        totalChannels, subscribedChannels 
                    },
                    "All Subscribed Channels fetched successfully")
            
                )
    } catch (error) {
        return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch subscribers"
        });
    }
}

const toggleSubscription = async(req,res) => {
    try {
        
        const userId = req.user?._id

        const { channelId } = req.params

        if (!channelId || !userId) {
            throw new ApiError_(400, "Channel id or User id is missing in params");
        }

        if(!isValidObjectId(channelId)){
            throw new ApiError_(400, "Invalid channel id");
        }

        if(!isValidObjectId(userId)){
            throw new ApiError_(400, "Unauthorized User");
        }

        const existingSubscription = await Subscription.findOne({
            subscriber: userId,
            channel: channelId
        })

        // if exist unsubscribe
        
        if(existingSubscription) {
            await Subscription.findByIdAndDelete(existingSubscription._id)

            return res.status(200).json(
            new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully")
            );
        }
        else {
            // Else Subscribe channel
            await Subscription.create({
                subscriber: userId,
                channel: channelId
            });

            return res.status(200).json(
                new ApiResponse(200, { subscribed: true }, "Subscribed successfully")
            );
        }
    } 
    catch (error) {
        return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
        });
    }

}

export { getUserChannelSubscribers, getChannelSubscribedByUser, toggleSubscription}