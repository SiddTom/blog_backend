import mongoose , {isValidObjectId} from "mongoose";
import {Post} from "../models/post.model.js"
import { asyncHandler } from "../utils/asynchandler.js";


const createpost = asyncHandler(async(req,res)=>{
    const {title,content,slug,Status,UseId,postedBy} = req.query
    if (!title) throw new ApiError(400, "Title is Required");
    if (!content) throw new ApiError(400, "Content is Required");

    let postFileLocalFilePath = null;
    if (req.files && req.files.postFile && req.files.postFile.length > 0) {
       postFileLocalFilePath = req.files.postFile[0].path;
    }
    if (!postFileLocalFilePath)
      throw new ApiError(400, "Post File Must be Required");

  const postfile = await uploadPostOnCloudinary(postFileLocalFilePath);
  if (!postfile) throw new ApiError(500, "Error while Uploading Post File");
  const post = await Post.create({
    featuredImg: postfile.url,
    title : title,
    content,
    Status: Status,
    UseId : UseId,
    postedBy : postedBy
  });
  if (!post) throw new ApiError(500, "Error while Publishing post");
  return res
  .status(200)
  .json(new ApiResponse(200, post, "post published successfully"));

});

const updatepost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { title,content } = req.body;
  
    // Validations
    if (!isValidObjectId(postId)) throw new ApiError(400, "Invalid VideoId...");
    const postLocalFilePath = req.file?.path;
    if (!title && !content && !postLocalFilePath) {
      throw new ApiError(400, "At-least one field required");
    }
  
    // check only owner can modify video
    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, "post not found");
  
    if (post.UseId.toString() !== req.user?._id.toString())
      throw new ApiError(401, "Only owner can modify video details");
  
    //Update based on data sent
    let postImg;
    if (postLocalFilePath) {
      postImg = await uploadPhotoOnCloudinary(postLocalFilePath);
      if (!postImg)
        throw new ApiError(500, "Error accured while uploading photo");
  
      await deleteImageOnCloudinary(post.featuredImg);
    }
    if (title) video.title = title;
    if (content) video.content = content;
    if (postImg) video.featuredImg = postImg.url;
  
    // Save in database
    const updatedpost = await post.save({ validateBeforeSave: false });
  
    if (!updatedpost) {
      throw new ApiError(500, "Error while Updating Details");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, updatedpost, "post updated successfully"));
  });


  const deletepost = asyncHandler(async (req, res) => {
    const { PostId } = req.params;
    if (!isValidObjectId(PostId)) throw new ApiError(400, "VideoId not found");
  
    const findRes = await Post.findByIdAndDelete(PostId);
  
    if (!findRes) throw new ApiError(400, "Video not found");
  
    await deleteVideoOnCloudinary(findRes.featuredImg);
    return res
    .status(200)
    .json(new APIResponse(200, [], "Video deleted successfully"));
});