import UserModel from "../models/User.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

class UserController {
    static userRegistration = async (req, resp) => {
        const { name, email, password, password_confirmation, tc } = req.body
        const user = await UserModel.findOne({ email: email })
        if (user) {
            resp.send({ "status": "failed", "message": "This email is already exists" })
        }
        else {
            if (name && email && password && password_confirmation && tc) {
                if (password === password_confirmation) {
                    try {
                        const salt = await bcrypt.genSalt(10)
                        const hashPassword = await bcrypt.hash(password, salt)
                        const doc = new UserModel({
                            name: name,
                            email: email,
                            //password: password,
                            password: hashPassword,
                            tc: tc
                        })

                        await doc.save()

                        const saved_user = await UserModel.findOne({email:email})

                        //jwt token generate
                        const token = jwt.sign({userId:saved_user._id}, process.env.JWT_SECRET_KEY, {expiresIn: '1d'})
                        resp.status(201).send({ "status": "success", "message": "Registration is Succesfully done" , "token": token})

                    } catch (error) {
                        console.log(error)
                        resp.send({ "status": "failed", "message": "Unable to registerr" })
                    }

                } else {
                    resp.send({ "status": "failed", "message": "password and password confirmation must be match" })
                }

            }
            else {
                resp.send({ "status": "failed", "message": "Please fill all details" })
            }
        }
    }

    static userLogin = async (req, resp) => {
        try {
            const {email,password} = req.body 
            if(email && password){
                const user = await UserModel.findOne({ email: email })
                if(user != null){
                    const isMatch = await bcrypt.compare(password, user.password ) 
                    if(user.email === email && isMatch){
                        const token = jwt.sign({userId:user._id}, process.env.JWT_SECRET_KEY, {expiresIn: '1d'})
                        resp.send({ "status": "success", "message": "Login is successfully", "token":token })
                    }
                    else{
                        resp.send({ "status": "failed", "message": "Email or password is wrong" })
                    }
                }
                else{
                    resp.send({ "status": "failed", "message": "You are not registered user" })
                }
            }
            else{
                resp.send({ "status": "failed", "message": "Please fill all details" })
            }
        }
        catch (error) {
            console.log(error)
            resp.send({ "status": "failed", "message": "Unable to login" })
        }
    }

    static changeUserPassword = async (req,resp) =>{
        const {password, password_confirmation} = req.body 
        if(password && password_confirmation){
            if(password === password_confirmation){
                const salt = await bcrypt.genSalt(10)
                const newhashPassword = await bcrypt.hash(password,salt)

                // console.log(req.user._id)

                //update password
                await UserModel.findByIdAndUpdate(req.user._id, {$set :{password:newhashPassword}})
                resp.send({ "status": "success", "message": "password changed successfully" })
            }
            else{
                resp.send({ "status": "failed", "message": "password and confirm password must be match" })
            }
        }
        else{
            resp.send({ "status": "failed", "message": "All fields are required" })
        }
    }

    static loggedUser = async(req,resp) =>{
        resp.send({"user": req.user})
    }

    static sendUserPasswordResetEmail = async (req,resp) => {
        const {email} = req.body

        if(email){
            const user = await UserModel.findOne({email:email})
        }
        else{
            resp.send({"status": "failed", "message": "Email field is required"})
        }
    }
}

export default UserController
