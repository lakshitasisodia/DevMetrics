import express from 'express';
import 'dotenv/config';
import githubRoute from './routes/githubRoute.js';
import { PORT } from './config/env.js';
import {connectDatabase} from '../database/src/prisma/db.ts'
import authroute from './routes/authroute.js'
import metricsRoute from "./routes/metricsRoute.js"
const app = express();

import cors from "cors";

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use('/api/github', githubRoute);
app.use('/api/auth', authroute);
app.use('/api/metrics',metricsRoute)

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server after connecting to the database
connectDatabase().then(
  ()=>{
    console.log('Database connected successfully');

    app.listen(PORT,()=>{
      console.log(`Server is running on port ${PORT}`);
    });
  }
)
.catch((error)=>{
  console.log('Database connection failed :',error);
  process.exit(1);
});