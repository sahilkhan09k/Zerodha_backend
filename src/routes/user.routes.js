import {Router} from 'express';
import { loadAllHoldings, login, register, loadAllPositions, placeNewOrder, sellOrder, logout, updateAvatar, refreshAccessToken, changeCurrentPassword, getCurrentUser } from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const userRouter = Router();

userRouter.route("/holdings").get(loadAllHoldings);
userRouter.route("/register").post(upload.single("avatar"), register);
userRouter.route("/login").post(login);
userRouter.route("/positions").get(loadAllPositions);
userRouter.route("/buyOrder").post(placeNewOrder);
userRouter.route("/sellOrder").post(sellOrder);
userRouter.route("/logout").post(verifyJWT, logout);
userRouter.route("/updateAvatar").post(verifyJWT, upload.single("avatar"), updateAvatar);
userRouter.route("/refresAccessToken").get(refreshAccessToken);
userRouter.route("/changeCurrentPassword").post(verifyJWT, changeCurrentPassword);
userRouter.route("/current").get(verifyJWT, getCurrentUser);

export { userRouter };