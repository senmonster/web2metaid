import {
  CLIENT_URL,
  COOKIE_NAME,
  JWT_SECRET,
  // prisma,
  SERVER_PORT,
} from './config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import { getTwitterUser, twitterOauth } from './oauth2';
import mongoose from 'mongoose';
import User, { IUser } from './models/user';
const app = express();
const origin = [CLIENT_URL];
app.use(cookieParser());
app.use(
  cors({
    origin,
    credentials: true,
  })
);

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// app.get('/ping', (_, res) => res.json('pong'));

type UserJWTPayload = Pick<IUser, 'id' | 'type'> & { accessToken: string };

// activate twitterOauth function when visiting the route
app.get('/oauth/twitter', twitterOauth);
app.get('/set-cookie', (req, res) => {
  // 设置名为 'exampleCookie' 的 cookie，值为 'hello'
  res.cookie('exampleCookie', 'hello', { maxAge: 900000, httpOnly: true });
  res.send('Cookie has been set');
});
app.get('/me', async (req, res) => {
  try {
    console.log('cookie', JSON.stringify(req.cookies));
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      throw new Error('Not Authenticated');
    }
    const payload = (await jwt.verify(token, JWT_SECRET)) as UserJWTPayload;
    console.log('payload: ' + JSON.stringify(payload));
    const userFromDb = await User.findOne({ id: payload?.id }).exec();
    console.log('userFromDb: ' + JSON.stringify(userFromDb));
    // const userFromDb = await prisma.user.findUnique({
    //   where: { id: payload?.id },
    // });
    if (!userFromDb) throw new Error('Not Authenticated');
    if (userFromDb.type === 'twitter') {
      if (!payload.accessToken) {
        throw new Error('Not Authenticated');
      }
      // const twUser = await getTwitterUser(payload.accessToken);
      // console.log('tw user', twUser);
      // if (twUser?.id !== userFromDb.id) {
      //   throw new Error('Not Authenticated');
      // }
    }
    res.json(userFromDb);
  } catch (err) {
    res.status(401).json('Not Authenticated');
  }
});

app.listen(SERVER_PORT, () =>
  console.log(`Server listening on port ${SERVER_PORT}`)
);
