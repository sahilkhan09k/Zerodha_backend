import express from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json({
    limit: '50mb'
}));

app.use(express.urlencoded({
    limit: '50mb',
    extended: true
}));

app.use(cors({
    origin: ['https://zerodha-frontend-phi.vercel.app/', 'https://zerodha-dashboard-gilt.vercel.app/'],
    credentials: true
}))

app.use(cookieParser());

//import router
import { userRouter } from './routes/user.routes.js';

app.use('/api/v1/user', userRouter)

export default app;