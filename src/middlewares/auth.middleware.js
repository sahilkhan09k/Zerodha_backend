import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";


const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
         const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
 
     if(!token) {
      throw new apiError("No token provided", 401);
     }
 
     const decodedInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
     const user = await User.findById(decodedInfo?._id).select("-password -refreshToken")
 
     if(!user) {
      throw new apiError("Invalid access token provided", 401);
     }
 
     req.user = user
     next()
    } catch (error) {
        throw new apiError("Unauthorized request", 401);
    }
})

export { verifyJWT }