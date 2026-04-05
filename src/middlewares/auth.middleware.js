import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "Unauthorized request, token not found");
    }

    // Verify token
    const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Use correct property 'id' from token
    const user = await User.findById(decodedtoken?.id).select("-password -refreshToken");
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});