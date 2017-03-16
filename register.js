/*
 * Copyright 2013-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
// START CONFIGURATION...

// client_secret is not used in the implicit profile
var redirect_uris = [
    server + openid + "/cb-basic.html",
    server + openid + "/cb-implicit.html"
];

// ...END CONFIGURATION
