import mongoose from "mongoose";

const connectDB = async (DATABASE_URL) => {
    try{
        const DB_OPTIONS = {
            DBNAME : "geekshop"
        }

        await mongoose.connect(DATABASE_URL,DB_OPTIONS )
        console.log("database connected")
    }
    catch (error)
    {
        console.log(error)
    }
}

export default connectDB