import { CLIENT_URL, COOKIE_NAME, upsertUserWithMongo } from './config';
import axios from 'axios';
import { CookieOptions, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// add your client id and secret here:
const TWITTER_OAUTH_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_OAUTH_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;

// the url where we get the twitter access token from
const TWITTER_OAUTH_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';

// we need to encrypt our twitter client id and secret here in base 64 (stated in twitter documentation)
const BasicAuthToken = Buffer.from(
  `${TWITTER_OAUTH_CLIENT_ID}:${TWITTER_OAUTH_CLIENT_SECRET}`,
  'utf8'
).toString('base64');

// filling up the query parameters needed to request for getting the token
export const twitterOauthTokenParams = {
  client_id: TWITTER_OAUTH_CLIENT_ID,
  code_verifier: '8KxxO-RPl0bLSxX5AWwgdiFbMnry_VOKzFeIlVA7NoA',
  redirect_uri: `${process.env.SERVER_URI}/oauth/twitter`,
  grant_type: 'authorization_code',
};

// the shape of the object we should recieve from twitter in the request
type TwitterTokenResponse = {
  token_type: 'bearer';
  expires_in: 7200;
  access_token: string;
  scope: string;
};

// the main step 1 function, getting the access token from twitter using the code that the twitter sent us
export async function getTwitterOAuthToken(code: string) {
  try {
    // POST request to the token url to get the access token
    const res = await axios.post<TwitterTokenResponse>(
      TWITTER_OAUTH_TOKEN_URL,
      new URLSearchParams({ ...twitterOauthTokenParams, code }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${BasicAuthToken}`,
        },
      }
    );

    return res.data;
  } catch (err) {
    return null;
  }
}

// the shape of the response we should get
export interface TwitterUser {
  id: string;
  name: string;
  username: string;
}

// getting the twitter user from access token
export async function getTwitterUser(
  accessToken: string
): Promise<TwitterUser | null> {
  try {
    // request GET https://api.twitter.com/2/users/me
    const res = await axios.get<{ data: TwitterUser }>(
      'https://api.twitter.com/2/users/me',
      {
        headers: {
          'Content-type': 'application/json',
          // put the access token in the Authorization Bearer token
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return res.data.data ?? null;
  } catch (err) {
    return null;
  }
}

// the function which will be called when twitter redirects to the server at `${process.env.SERVER_URI}/oauth/twitter`
export async function twitterOauth(
  req: Request<any, any, any, { code: string }>,
  res: Response
) {
  const code = req.query.code; // getting the code if the user authorized the app
  // 1. get the access token with the code
  const twitterOAuthToken = await getTwitterOAuthToken(code);
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
  const cookieOptions: CookieOptions = {
    httpOnly: false,
    sameSite: false,
  };
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions,
    expires: new Date(Date.now() + 7200 * 1000),
  });
  // addCookieToRes(res, user, twitterOAuthToken.access_token);
  // 5. finally redirect to the client
  return res.redirect(CLIENT_URL);
}
