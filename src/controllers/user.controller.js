import {asyncHandler} from "../utils/asynchandler.js"
import { ApiError } from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js";

const generateAccessAndRefreshToken = async (_id) => {
    try {
      const user = await User.findById(_id);
  
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
  
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });
  
      return { refreshToken, accessToken };
    } catch (error) {
      throw new ApiError(
        500,
        "Something went wrong while generating refresh and access token"
      );
    }
  };
  const registerUser = asyncHandler(async (req, res) => {
    // Get the data from frontend
    // Validate the data - Check if empty or not
    // check if user exists or not
    // Handle file uploads
    // upload files in cloudinary
    // create user
    // check if user created successfully
    // send back the response
  
    // Getting the data from frontend
    let { password, name, email } = req.body;
  
    // Validating and formating the data
    if (
      [name, password, email].some((field) => field?.trim() === "")
    ) {
      throw new ApiError(400, `all fields are required!!!`);
    }
  
    // checking if user exists or not
    const userExist = await User.findOne({
      email
    });
  
    if (userExist) {
      // throw new APIError(400, "User Already Exists...");
      return res
        .status(400)
        .json(new ApiResponse(400, [], "User Already Exists..."));
    }
    const createdUser = await User.create({
        password,
        email,
        name,
      });
    
      // checking if user is created successfully
    
      const userData = await User.findById(createdUser._id).select(
        "-password -refreshToken"
      );
    
      if (!userData) {
        throw new ApiError(500, "Something went wrong while registering the user");
      }
    
      // Send back data to frontend
      return res
        .status(201)
        .json(new ApiResponse(200, userData, "Account Created Successfully"));
    });
    const loginUser = asyncHandler(async (req, res) => {
        // data <- req.body
        // validate data
        // find User
        // generate tokens
        // store tokens in database
        // set tokens in cookie
        // send response
      
        // data <- req.body
      
        let { email, password } = req.body;
      
        // validate
        if (!email || !password) {
          throw new ApiError(400, "password or Email is required");
        }
      
        // find User
        const user = await User.findOne({
          email
        });
      
        if (!user) {
          // throw new APIError(404, "User not Found");
          return res.status(404).json(new ApiResponse(404, [], "User not Found"));
        }
      
        const isCredentialValid = await user.isPasswordCorrect(password);
        if (!isCredentialValid) {
          // throw new APIError(401, "Credential Invalid");
          return res
            .status(401)
            .json(new ApiResponse(401, [], "Invalid Credentials"));
        }
      
        // generate and store tokens
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
          user._id
        );
      
        const loggedInUser = await User.findById(user._id).select(
          "-password -refreshToken"
        );
      
        // set tokens in cookie and send response
        // const cookieOptions = {
        //   httpOnly: true,
        //   secure: true,
        //   sameSite: "None",
        //   Partitioned: true,
        // };
      
        res.setHeader(
          "Set-Cookie",
          `accessToken=${accessToken}; Max-Age=${1 * 24 * 60 * 60 * 1000}; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`
        );
      
        // res.setHeader(
        //   "Set-Cookie",
        //   `__Host-refreshToken=${refreshToken}; Max-Age=${10 * 24 * 60 * 60 * 1000}; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`
        // );
      
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              { user: loggedInUser, accessToken, refreshToken },
              "Logged In Successfully"
            )
          );
      });
      
      const logoutUser = asyncHandler(async (req, res) => {
        await User.findByIdAndUpdate(
          req.user?._id,
          {
            $unset: {
              refreshToken: 1,
            },
          },
          {
            new: true,
          }
        );
      
        const cookieOptions = {
          httpOnly: true,
          secure: true,
          sameSite: "None",
        };
      
        res.setHeader(
          "Set-Cookie",
          `accessToken=; Max-Age=-1; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`
        );
      
        // .clearCookie("accessToken", {
        //   ...cookieOptions,
        //   maxAge: 1 * 24 * 60 * 60 * 1000,
        // })
        // .clearCookie("refreshToken", {
        //   ...cookieOptions,
        //   maxAge: 10 * 24 * 60 * 60 * 1000,
        // })
      
        return res
          .status(200)
          .json(new ApiResponse(200, {}, "Logged out Successfully"));
      });
      
      const refreshAccessToken = asyncHandler(async (req, res) => {
        const incomingRefreshToken =
          req.cookies.refreshToken || req.body.refreshToken;
      
        if (!incomingRefreshToken) {
          throw new ApiError(401, "unauthorized request");
        }
      
        try {
          const decodedRefreshToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
          );
      
          const user = await User.findById(decodedRefreshToken?._id);
      
          if (!user) {
            throw new ApiError(401, "Invalid Refresh Token");
          }
      
          if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
          }
      
          const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
            user._id
          );
      
          const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            Partitioned: true,
          };
      
          res.setHeader(
            "Set-Cookie",
            `accessToken=${accessToken}; Max-Age=${1 * 24 * 60 * 60 * 1000}; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`
          );
      
          // res.setHeader(
          //   "Set-Cookie",
          //   `refreshToken=${refreshToken}; Max-Age=${10 * 24 * 60 * 60 * 1000}; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`
          // );
      
          return res
            .status(200)
            .json(
              new ApiResponse(
                200,
                { accessToken, newRefreshToken: refreshToken },
                "Access Token Granted Successfully"
              )
            );
        } catch (error) {
          throw new ApiError(401, error?.message || "Invalid refresh token");
        }
      });
      const getCurrentUser = asyncHandler(async (req, res) => {
        return res
          .status(200)
          .json(new ApiResponse(201, req.user, "User fetched Successfully"));
      });
export {registerUser,generateAccessAndRefreshToken,refreshAccessToken,logoutUser,loginUser,getCurrentUser}