import UserModel from "../models/User.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import transporter from "../config/emailConfig.js";

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
                        resp.send({ "status": "failed", "message": "Unable to register" })
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
            console.log(user)
            if(user){
                const secret = user._id + process.env.JWT_SECRET_KEY
                const token = jwt.sign({userId: user._id}, secret, {expiresIn: '10m'})
                const link = `http://127.0.0.1:3000/api/user/reset/${user._id}/${token}`

                console.log(link)


                //send email
                let info = await transporter.sendMail({
                    from : process.env.EMAIL_FROM,
                    to: user.email,
                    subject: "TESTING NODEMAILER",
                    html: `<a href = ${link}>Click here </a> to reset your password`
                })


                resp.send({"status": "success", "message": "Email for reset password is sent ..Please check", "info":info})
            }
            else{
                resp.send({"status": "failed", "message": "Email does not exist"})
            }
        }
        else{
            resp.send({"status": "failed", "message": "Email field is required"})
        }
    }

    static userPasswordReset = async (req,resp) => {
        const {password, password_confirmation} = req.body
        const {id, token} = req.params

        const user = await UserModel.findById(id)
        const new_secret = user._id + process.env.JWT_SECRET_KEY

        try{
            jwt.verify(token, new_secret)
            if(password && password_confirmation)
                {
                    if(password === password_confirmation){
                        const salt = await bcrypt.genSalt(10)
                        const newHashPassword = await bcrypt.hash(password, salt)
                        await UserModel.findByIdAndUpdate(user._id, {$set :{password:newHashPassword}})

                        resp.send({"status": "success", "message": "password reset succesfully"})
                    }
                    else{
                        resp.send({"status": "failed", "message": "New password and New confirm password must be match"})
                    }
                }
            else
                {
                    resp.send({"status": "failed", "message": "All fields are required"})
                }
        }catch (error){
            console.log(error)
            resp.send({"status": "failed", "message": "Invalid token"})
        }
    }
}

export default UserController
