import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const postSchema = new Schema({
    title:{
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    featuredImg: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    Status: {
        type: Boolean,
        required: true
    },
    UserId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    postedBy: {
        type: String,
        required: true
    }



},{
    timestamps:true
})
postSchema.plugin(mongooseAggregatePaginate)

export const Post = mongoose.model("Post", postSchema)