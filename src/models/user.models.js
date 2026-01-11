import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema( {
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: { 
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,//cloudinary url image
        default: '',
        required: true
    },
    coverImage: {
        type: String,//cloudinary url image
    },
    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Video'
        }
    ],
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String,
        default: ''     
    },
},
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    // hash the password before saving the user model using pre hook(a middleware that is executed before saving data inside db).

    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPassweordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(// sign method creates the jwt tokem
        {
            _id: this._id,// id from mongodb
            email: this.email,//this (coming from database userSchema model) refers to the particular user.
            username: this.username,//username from database userSchema model.
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(// sign method creates the jwt tokem
        { 
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};

const User = mongoose.model('User', userSchema);

export { User };