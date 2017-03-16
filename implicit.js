/*
 * Copyright 2013-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
// START CONFIGURATION...

// client_secret is not used in the implicit profile
var redirect_uri = server + openid + "/cb-implicit.html";
var state        = "af0ifjsldkj";
var nonce        = "n-0S6_WzA2Mj";

// ...END CONFIGURATION

/* Returns a map of parameters present in the document fragment. */
function getParamsFromFragment() {
    var params   = {};
    var postBody = location.hash.substring(1);
    var regex    = /([^&=]+)=([^&]*)/g, m;

    while (m = regex.exec(postBody)) {
        params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }

    return params;
}
