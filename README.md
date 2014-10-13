# OpenID Connect Examples

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
and showing how to register a client dynamically.

* * *
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.

Copyright 2013-2014 ForgeRock AS
