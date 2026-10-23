import { Router } from "express";
import argon2 from 'argon2';
import {db} from '../../database/src/prisma/db.ts'
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from "../config/env.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = Router();

router.post('/register', async (req , res)=>{
  try {
    const {name,email,password} = req.body || {};

    if(!name || !email || !password) {
      return res.status(400).json({
        error: "Name , email , and password are required"
      });
    }

    const existingUser = await db.orm.public.User
    .where({email})
    .first();

    if(existingUser){
      return res.status(409).json({
        error : "Email is already registered"
      });
    }

    const passwordHash = await argon2.hash(password);

    const user = await db.orm.public.User.create({
      name,
      email,
      passwordHash
    });

    return res.status(201).json({
      message : "User registered successfully",
      user:{
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Registration error :", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

router.post('/login' , async (req,res)=>{
  try {
    const { email , password } = req.body || {};

    if(!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const user = await db.orm.public.User
    .where({email})
    .first();

    if(!user){
      return res.status(401).json({
        error : "Email or password is incorrect"
      });
    }

    const passwordValid = await argon2.verify(user.passwordHash , password);

    if(!passwordValid){
      return res.status(401).json({
        error : "Email or password is incorrect"
      });

    }

    const token = jwt.sign(
      {userId: user.id},
      JWT_SECRET,
      {expiresIn : '1h'}
    )

    return res.status(200).json({
      message : 'Login successful',
      token,
      user : {
        id: user.id,
        name:user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error : ", error);
    res.status(500).json({error : "Internal server error"});
  }
})

router.get('/protected' , authMiddleware, (req,res)=>{
  return res.status(200).json({
    message : "You accessed a protected route",
    user: req.user
  });
});

export default router;