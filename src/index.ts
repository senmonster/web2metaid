import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import express, { CookieOptions } from 'express';
import jwt from 'jsonwebtoken';
import { AuthDataValidator } from '@telegram-auth/server';
import { urlStrToAuthDataMap } from '@telegram-auth/server/utils';
import 'dotenv/config';
// load config
import {
  CLIENT_URL,
  TWITTER_COOKIE_NAME,
  TELEGRAM_COOKIE_NAME,
  JWT_SECRET,
  SERVER_PORT,
  upsertUserWithMongo,
} from './config';
import { getTwitterOAuthToken } from './oauth2';
// import { twitterOauth } from './oauth2';
import { getTwitterUser } from './oauth2';
import UserModel, { IUser, UserDocument } from './models/User';
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
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));
console.log('clent url', CLIENT_URL);
app.get('/ping', (req, res) => {
  console.log('cookie ping', JSON.stringify(req.cookies));

  res.json('pong ' + CLIENT_URL + 'token: ' + JSON.stringify(req.cookies));
});

type UserJWTPayload = Pick<UserDocument, 'id' | 'type'> & {
  accessToken: string;
};

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
  const user = await upsertUserWithMongo({ ...twitterUser, type: 'twitter' });
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
  res.cookie(TWITTER_COOKIE_NAME, token, {
    ...cookieOptions,
    expires: new Date(Date.now() + 7200 * 1000),
  });
  // addCookieToRes(res, user, twitterOAuthToken.access_token);
  // 5. finally redirect to the client

  return res.redirect(CLIENT_URL);
});

app.get('/twitter/me', async (req, res) => {
  try {
    console.log('cookie', JSON.stringify(req.cookies));
    const token = req.cookies[TWITTER_COOKIE_NAME];
    if (!token) {
      throw new Error('Not Authenticated');
    }
    const payload = (await jwt.verify(token, JWT_SECRET)) as UserJWTPayload;
    console.log('payload: ' + JSON.stringify(payload));
    const userFromDb = await UserModel.findOne({ id: payload?.id }).exec();
    console.log('X userFromDb: ' + JSON.stringify(userFromDb));
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

app.get('/oauth/telegram', async (req, res) => {
  const botToken = process.env.TG_BOT_TOKEN;

  const validator = new AuthDataValidator({
    botToken,
  });
  console.log('req url', req.url);
  const data = urlStrToAuthDataMap(`${process.env.SERVER_URI}${req.url}`);

  try {
    // 1 validate user and store to mongoDB
    const user = await validator.validate(data);
    const userName = user.first_name + ' ' + user.last_name;
    const tgUser: IUser = {
      name: userName,
      id: user.id.toString(),
      username: userName,
      type: 'telegram',
    };
    await upsertUserWithMongo(tgUser);
    console.log('update tg user', tgUser);

    // 2 create cookie so that the server can validate the user
    const token = jwt.sign(
      {
        id: tgUser.id,
        accessToken: botToken,
        type: tgUser.type,
      },
      process.env.JWT_SECRET!
    );

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
    res.cookie(TELEGRAM_COOKIE_NAME, token, {
      ...cookieOptions,
      expires: new Date(Date.now() + 7200 * 1000),
    });

    // 3. finally redirect to the client

    return res.redirect(CLIENT_URL);
  } catch (error) {
    console.error('valiate tg user error', error);
  }
});

app.get('/telegram/me', async (req, res) => {
  try {
    console.log('cookie', JSON.stringify(req.cookies));
    const token = req.cookies[TELEGRAM_COOKIE_NAME];
    if (!token) {
      throw new Error('Not Authenticated');
    }
    const payload = (await jwt.verify(token, JWT_SECRET)) as UserJWTPayload;
    console.log('payload: ' + JSON.stringify(payload));
    const userFromDb = await UserModel.findOne({ id: payload?.id }).exec();
    console.log('tg userFromDb: ' + JSON.stringify(userFromDb));
    // const userFromDb = await prisma.user.findUnique({
    //   where: { id: payload?.id },
    // });
    if (!userFromDb) throw new Error('Not Authenticated');
    if (userFromDb.type === 'telegram') {
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
