import {asyncHandler} from '../utils/asyncHandler.js';
import{ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import jwt from "jsonwebtoken";


export const generateAccessAndRefreshTokens = async (userid) => {
  try {
    console.log("Generating tokens for user ID:", userid);

    const user = await User.findById(userid);
    if (!user) {
      throw new Error("User not found with this ID");
    }
    console.log("User found:", user.email);

    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      throw new Error("JWT secrets are missing in .env");
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Tokens generated successfully");
    return { accessToken, refreshToken };

  } catch (err) {
    console.error("Error in generateAccessAndRefreshTokens:", err);
    throw new Error(
      "Something went wrong while generating refresh and access token: " + err.message
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
    const {fullName, email, username, password} = req.body;
    console.log(req.body,"..............");
    console.log("email", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
        $or: [
            {username},
            {email}
        ]
    });
    
    if (existingUser) {
        throw new ApiError("User already exists", 409);
    }
    
   const avatarLocalPath = req.files?.avatar?.[0]?.path || req.file?.path;
   const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar is required");
    }
     const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar:avatar,
        coverImage:coverImage || ""
    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "User creation failed");
    }
    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
});
const loginUser = asyncHandler(async (req, res) => {
    // req body
    //username or email
    //find the user
    //password check
    //access  and refreshToken 
    //send cookies
    const { email, username, password } = req.body;
    if(!username && !email){
        throw new ApiError(400, "Username or email is required");
    }
    const user = await User.findOne({
        $or: [
            {username},
            {email}
        ]
    });
    if(!user){
        throw new ApiError(404, "User not found");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials");
    }
   const{accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

   const Options = {
    httpOnly: true,
    secure:true}
    return res
    .status(200)
    .cookie("accessToken",accessToken, Options)
    .cookie("refreshToken", refreshToken, Options)
    .json(new ApiResponse(200,{
        user: loggedInUser,
        accessToken,
        refreshToken
    }, "User logged in successfully"));
})
 const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

    
})
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
     const isPasswordCorrect = await isPasswordCorrect(currentPassword);
     if(!isPasswordCorrect){
        throw new ApiError(401, "Current password is incorrect");
     }
         user.password = newPassword;
         await user.save({ validateBeforeSave: false })
         return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))

    })

    const getcurrentUser = asyncHandler(async (req, res) => {
        return res.status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"))

    })

const updateAccountDetails = asyncHandler(async (req, res) => {
    const{fullName,email} = req.body;

    if(!fullName||email) {
        throw new ApiError(400, "All fields are required");
    }

    const User = User.findByIdAndUpdate(
        req.user?._id,{
            $set:{
                fullName:fullName,
                email:email
            }
        },
        {new:true}
    ).select("-password")
    return res.status(200)
    .json(new ApiResponse(200, updatedUser, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path 
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(500, "Failed to upload avatar");
    }
    const  user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password");
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))
})
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path 
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image is required");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(500, "Failed to upload cover image");
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password");
    return res
    .status(200)
    .json(new ApiResponse
    (200, user, "Cover image updated successfully"))
})
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const{username} = req.params;
    if(!username?.trim()){
        throw new ApiError(400, "Username is required");
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribed to"
            }

        },
            {
         $addFields: {
            subscribersCount: {
                $size: "$subscribers"

            },
            channelsSubscribedToCount: {
                $size: "$subscribedTo"
            },
            isSubscribed: {
              $cond : {
                if: {
                    $in: [req.user?._id, "$subscribers.subscriber"]},
                then: true,
                else: false
              }

            }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                isSubscribed: 1
        }
    }
    ])
    if (!channel?.length){
        throw new ApiError(404, "channel not found"); 
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "Channel profile fetched successfully")
     )
})
const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
             $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
             }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [ 
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner", 
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        },
                       
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory,  "Watch history fetched successfully")
     )
})

export{
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getcurrentUser,
    changePassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getWatchHistory
}