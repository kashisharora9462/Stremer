import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema( {
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    videoFile: {
        type: String, // cloudinary url
        required: true
    },
    thumbnail: {
        type: String, // cloudinary url
        required: true
    },
    duration: {
        type: Number, // cloudinary video duration
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
},
{ timestamps: true } );

videoSchema.plugin(mongooseAggregatePaginate);// plugin means to add additional functionality to original schema.Here we are adding pagination functionality to video schema. 

const Video = mongoose.model('Video', videoSchema);

export { Video };