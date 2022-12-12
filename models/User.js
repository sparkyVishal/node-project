import mongoose from "mongoose";

//schema define

const userSchema = new mongoose.Schema({
    name : {type:String, required:true , trim:true},
    email : {type:String, required:true , trim:true},
    password : {type:String, required:true , trim:true},
    tc : {type:Boolean, required:true , trim:true},
    hash : String,
    salt : String
})

const UserModel = mongoose.model("user", userSchema)

export default UserModel