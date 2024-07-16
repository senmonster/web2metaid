import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import express, { CookieOptions } from 'express';
import jwt from 'jsonwebtoken';
// import { AuthDataValidator } from '@telegram-auth/server';
// import { urlStrToAuthDataMap } from '@telegram-auth/server/utils';
import 'dotenv/config';
// load config
import {
  CLIENT_URL,
  COOKIE_NAME,
  JWT_SECRET,
  SERVER_PORT,
  upsertUserWithMongo,
} from './config';
import { getTwitterOAuthToken } from './oauth2';
// import { twitterOauth } from './oauth2';
import { getTwitterUser } from './oauth2';
import User, { IUser } from './models/xUser';
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
  .connect(process.env.MONGO_CLOUD_URI!)
  .then(() => console.log('MongoDB connected', CLIENT_URL))
  .catch((err) => console.log(err));
console.log('clent url', CLIENT_URL);
app.get('/ping', (req, res) => {
  console.log('cookie ping', JSON.stringify(req.cookies));

  res.json('pong ' + CLIENT_URL + 'token: ' + JSON.stringify(req.cookies));
});

type UserJWTPayload = Pick<IUser, 'id' | 'type'> & { accessToken: string };

// activate twitterOauth function when visiting the route
// app.get('/oauth/twitter', twitterOauth);
app.get('/oauth/twitter', async (req, res) => {
  const code = req.query.code; // getting the code if the user authorized the app
  console.log('code', JSON.stringify(code));
  // 1. get the access token with the code
  const twitterOAuthToken = await getTwitterOAuthToken(code as string);
  console.log('twitterOAuthToken', twitterOAuthToken);
  if (!twitterOAuthToken) {
    // redirect if no auth token
    return res.redirect(CLIENT_URL);
  }

  // 2. get the twitter user using the access token
  const twitterUser = await getTwitterUser(twitterOAuthToken.access_token);
  console.log('twitterUser', twitterUser);
  if (!twitterUser) {
    // redirect if no twitter user
    return res.redirect(CLIENT_URL);
  }

  // 3. upsert the user in our db
  const user = await upsertUserWithMongo(twitterUser);
  console.log('updating user', user);

  // 4. create cookie so that the server can validate the user

  const { id, type } = user;
  const token = jwt.sign(
    {
      // Signing the token to send to client side
      id,
      accessToken: twitterOAuthToken.access_token,
      type,
    },
    process.env.JWT_SECRET!
  );

  // adding the cookie to response here
  console.log('add token', token);

  // cookie setting options

  const cookieOptions: CookieOptions =
    process.env.NODE_ENV !== 'production'
      ? {
          httpOnly: true,
          // sameSite: false,
          // secure: false,
        }
      : {
          httpOnly: false,
          secure: true,
          sameSite: 'none',
        };
  console.log('cookieOptions', cookieOptions);
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions,
    expires: new Date(Date.now() + 7200 * 1000),
  });
  // addCookieToRes(res, user, twitterOAuthToken.access_token);
  // 5. finally redirect to the client

  return res.redirect(CLIENT_URL);
});

app.get('/web2metaid/me', async (req, res) => {
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

// app.get('/auth/telegram', async (req, res) => {
//   const validator = new AuthDataValidator({ botToken: process.env.BOT_TOKEN });

//   const data = urlStrToAuthDataMap(req.url);

//   try {
//     const user = await validator.validate(data);

//     // The data is now valid and you can sign in the user.

//     console.log(user);
//   } catch (error) {
//     console.error(error);
//   }
// });

app.listen(SERVER_PORT, () =>
  console.log(`Server listening on port ${SERVER_PORT}`)
);
