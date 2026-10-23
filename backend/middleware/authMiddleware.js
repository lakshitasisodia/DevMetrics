import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

const authMiddleware = (req,res,next)=>{
    try {
        const authHeader = req.headers.authorization;

        if(!authHeader){
            return res.status(401).json({
                error: "Authorization token is required"
            });
        }

        const parts = authHeader.split(" ");

        if(parts.length !== 2 || parts[0] !== 'Bearer'){
            return res.status(401).json({
                error : " Invalid authorization format"
            });
        }
        const token = parts[1];
        const decoded = jwt.verify(token,JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(500).json({
            error : 'Invalid or expried token'
        })
    }

}


export default authMiddleware;