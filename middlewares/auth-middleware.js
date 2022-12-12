import jwt from 'jsonwebtoken'
import UserModel from '../models/User.js'

var checkUserAuth = async (req,resp, next) => {
    let token
    
    const {authorization} = req.headers

    if(authorization && authorization.startsWith('Bearer')){
        try{
            token = authorization.split(' ')[1]
            //console.log("Token",token)
            //console.log("Authorization",authorization)

            //verify token
            const {userId} = jwt.verify(token, process.env.JWT_SECRET_KEY)

            // console.log(userId)

            //get user from token

            req.user = await UserModel.findById(userId).select('-password')
            // console.log(req.user)
            next()
        }
        catch (error){
            console.log(error)
            resp.status(401).send({"status": "failed","message":"Unauthorized User"})
        }
    }

    if(!token){
        resp.status(401).send({"status": "failed","message":"Unauthorized User, No Token"})
    }
}

export default checkUserAuth