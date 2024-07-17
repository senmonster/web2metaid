import XUser, { IUser } from './models/User';
// import { Response } from 'express';
// import jwt from 'jsonwebtoken';

export const CLIENT_URL = process.env.CLIENT_URL!;
export const SERVER_PORT = process.env.SERVER_PORT!;

export async function upsertUserWithMongo(user: IUser) {
  // create a new user in our database or return an old user who already signed up earlier
  try {
    const updatedUser = await XUser.findOneAndUpdate(
      { id: user.id }, // 查询条件
      {
        username: user.username,
        id: user.id,
        name: user.name,
        type: user.type,
      }, // 更新内容
      { new: true, upsert: true } // 选项：new 表示返回更新后的文档，upsert 表示如果文档不存在则创建
    );

    return updatedUser;
  } catch (error) {
    console.error('Error upserting user:', error);
    throw error;
  }
}

// JWT_SECRET from our environment variable file
export const JWT_SECRET = process.env.JWT_SECRET!;

// cookie name
export const TWITTER_COOKIE_NAME = 'twitter_oauth2_token';
export const TELEGRAM_COOKIE_NAME = 'telegram_oauth2_token';

// step 4
// export function addCookieToRes(
//   res: Response,
//   user: IUser,
//   accessToken: string
// ) {
//   const { id, type } = user;
//   const token = jwt.sign(
//     {
//       // Signing the token to send to client side
//       id,
//       accessToken,
//       type,
//     },
//     JWT_SECRET
//   );

//   // adding the cookie to response here
//   res.cookie(COOKIE_NAME, token, {
//     // ...cookieOptions,
//     // expires: new Date(Date.now() + 7200 * 1000),
//   });
// }
