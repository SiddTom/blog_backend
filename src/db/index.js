import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async ()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log("MongoDB is connected",connectionInstance.connection.host)
    }catch(error){
        console.log("Connection to MongoDB failed",error)
        process.exit(1)
    }
}
export default connectDB