import { Holding } from "../models/holdings.model.js";
import { Order } from "../models/orders.model.js";
import { Position } from "../models/positions.model.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/uploadOnCloudinary.js";


const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if(!user) {
      throw new apiError("User not found", 404);
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave : false});

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError("Failed to generate tokens", 500);
  }
}

const register = asyncHandler(async (req, res) => {
  const {userName, email, password} = req.body;

  if([userName, email, password].some((field) => !field?.trim())) {
    throw new apiError("All fields are required", 400);
  }

  // const localAvatarPath = req.file?.path;

  // if(!localAvatarPath) {
  //   throw new apiError("Avatar is required", 400);
  // }

  const existedUser = await User.findOne({email})

  if(existedUser) {
    throw new apiError("User already exists", 400);
  }

  if(password.length < 8) {
    throw new apiError("Password must be at least 8 characters long", 400);
  }

  // const avatarResponse = await uploadOnCloudinary(localAvatarPath);

  // if(!avatarResponse?.url) {
  //   throw new apiError("Failed to upload avatar", 500);
  // }

  const user = await User.create({
    userName,
    email,
    password,
    // avatar: avatarResponse.url
  });

  if(!user) {
    throw new apiError("Failed to create user", 500);
  }

  const createdUser = user.toObject();
  delete createdUser.password;
  delete createdUser.refreshToken;
  return res.status(201).json(new apiResponse(201, createdUser, "User registered successfully"));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if(!email || !password) {
    throw new apiError("All fields are required", 400);
  }

  const user = await User.findOne({ email });

  if(!user) {
    throw new apiError("User not found", 404);
  }

  const isMatch = await user.isPasswordCorrect(password);

  if(!isMatch) {
    throw new apiError("Invalid credentials", 401);
  }

  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user?._id);

  const loggedInUser = user.toObject();
  delete loggedInUser.password;
  delete loggedInUser.refreshToken;

  const options = {
    httpOnly : true,
    secure : true
  }

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(new apiResponse(200, loggedInUser, "User logged in successfully"));
});

const logout = asyncHandler (async (req, res) => {
  try {
    const user = req?.user;
    if(!user || !req.user._id) {
      throw new apiError("User not found", 404);
    }

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set : {refreshToken : null}
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
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new apiResponse(200, null, "User logged out successfully"));
  } catch (error) {
    throw new apiError("Failed to logout user", 500);
  }
})

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarPath = req.file?.path;
  if (!avatarPath) {
    throw new apiError("Avatar is required", 400);
  }

  const avatar = await uploadOnCloudinary(avatarPath);
  if (!avatar?.url) {
    throw new apiError("Something went wrong while uploading avatar", 500);
  }

  // Use req.user directly (set in verifyJWT)
  const user = req.user;
  if (!user) {
    throw new apiError("User not found", 404);
  }

  user.avatar = avatar.url;
  await user.save({ validateBeforeSave: false });

  const updatedUser = user.toObject();
  delete updatedUser.password;
  delete updatedUser.refreshToken;

  return res
    .status(200)
    .json(new apiResponse(200, updatedUser, "Avatar updated successfully"));
});

const loadAllHoldings = asyncHandler(async (req, res) => {
  const allHoldings = await Holding.find();

  if (!allHoldings) {
    throw new apiError("No holdings found", 404);
  }

  return res
    .status(200)
    .json(new apiResponse(200, allHoldings, "Holdings fetched successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incominRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incominRefreshToken) {
        throw new apiError(400, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incominRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if(!user) {
            throw new apiError(401, "invalid refresh token")
        }
    
        if(incominRefreshToken !== user?.refreshToken) {
            throw new apiError(401, "refresh token is expired or used")
        }
    
        const options  = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    
       return res
       .status(200)
       .cookie("accessToken", accessToken, options)
       .cookie("refreshToken", refreshToken, options)
       .json(
            new apiResponse(
                200,
                {accessToken, refreshToken : refreshToken},
                "Access token refreshed succesfully"
            )
        )
    } catch (error) {
        throw new apiError(401, error?.message || "refersh token was wrong")
    }
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const{oldPassword, newPassword} = req.body
    const user =  await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect) {
        throw new apiError(401, "incorrect old password entered")
    }

    user.password = newPassword
   await user.save({validateBeforeSave : false})

   return res
   .status(200)
   .json(
      new apiResponse(200, "Passowrd changed succesfully")
   )
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(
       new apiResponse(200, req.user, "User fetched succesfully")
    )
})

const loadAllPositions = asyncHandler(async (req, res) => {
  const allPositions = await Position.find();

  if (!allPositions) {
    throw new apiError("No positions found", 404);
  }

  return res
    .status(200)
    .json(new apiResponse(200, allPositions, "Positions fetched successfully"));
});

const placeNewOrder = asyncHandler(async (req, res) => {
  const { name, qty, price, mode } = req.body;

  if (!name || !qty || !price || !mode) {
    throw new apiError("All fields are required", 400);
  }

  const order = await Order.create({
    name,
    qty,
    price,
    mode,
  });

//   const holding = await Holding.create({
//     name,
//     qty,
//     avg: (price * 1000) / 100,
//     price,
//     net: `${(Math.random() * 4).toFixed(2)} %`,
//     day: `${(Math.random() * 2).toFixed(2)} %`,
//   });

const holding = await Holding.findOne({ name });
if(!holding) {
  await Holding.create({
    name,
    qty,
    avg: (price * 1000) / 100,
    price,
    net: `${(Math.random() * 4).toFixed(2)} %`,
    day: `${(Math.random() * 2).toFixed(2)} %`,
  });
} else {
    holding.qty  = Number(holding.qty) + Number(qty);
    holding.price = Number(price);
    await holding.save();
}

  return res
    .status(201)
    .json(new apiResponse(201, order, "Order placed successfully"));
});

const sellOrder = asyncHandler(async (req, res) => {
  const { id, qty } = req.body;

  if (!id || !qty) {
    throw new apiError("All fields are required", 400);
  }

  const holding = await Holding.findOne({ name: id });

  if (!holding) {
    throw new apiError("Holding not found", 404);
  }

  if (holding.qty < qty) {
    throw new apiError("Insufficient quantity", 400);
  }

  holding.qty  = Number(holding.qty) - Number(qty);

  if (holding.qty === 0) {
    await Holding.deleteOne({ name: id });
  } else {
    await Holding.updateOne({ name: id }, { qty: holding.qty });
  }

  return res
    .status(200)
    .json(new apiResponse(200, null, "Order sold successfully"));
});

export {
  register,
  login,
  loadAllHoldings,
  loadAllPositions,
  placeNewOrder,
  sellOrder,
  logout,
  updateAvatar,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser
};
