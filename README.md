# OpenID Connect Examples

This is a ForgeRock Community Project.

## Warning
**This code is not supported by ForgeRock and it is your responsibility to verify that the software is suitable and safe for use.**

## About

These simple examples use the OpenID Connect 1.0 provider support in
OpenAM 11.0.0 and later.

1.   Clone the project for deployment in your container alongside OpenAM.
     For example, with OpenAM in `/path/to/tomcat/webapps/openam`,
     clone this under `/path/to/tomcat/webapps`
     into `/path/to/tomcat/webapps/openid`.
2.   Adjust the configuration as necessary.
     See the `*.js` files.
3.   Create the agent profile as described in the examples.
4.   Try it out.

The examples are not secure. Instead they are completely transparent,
showing the requests and the steps for the Basic and Implicit Profiles,
showing how to register with OpenID Connect Dynamic Client Registration,
and showing OpenAM as OP and Authenticator for GSMA Mobile Connect.
(Mobile Connect support requires OpenAM 12 or later.)

* * *
Copyright 2013-2017 ForgeRock AS. All Rights Reserved

Use of this code requires a commercial software license with ForgeRock AS.
or with one of its affiliates. All use shall be exclusively subject
to such license between the licensee and ForgeRock AS.
