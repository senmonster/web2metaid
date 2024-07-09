# This a full-stack application which used to bind traditional Web2 applications with Metaid

## Twitter Authentication

Use [OAuth 2.0](https://developer.x.com/en/docs/authentication/oauth-2-0) for Authentication

## DataBase

Store user information in the mongoDB database

## How to determine whether user has been bound

1. get signature from inscription history for specified protocol path(/protcols/web2metaid)
2. Signature verification: compare with current PIN message, using method VerfiyMessage

## Bind Operation

1. Generating signature from metaid and twitterID with specified rules(Using method SignMessage)
2. inscribe the payload(appName、handler、signature)
