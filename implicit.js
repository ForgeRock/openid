/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * If applicable, add the following below this MPL 2.0 HEADER, replacing
 * the fields enclosed by brackets "[]" replaced with your own identifying
 * information:
 *     Portions Copyright [yyyy] [name of copyright owner]
 *
 *     Copyright 2013 ForgeRock AS
 *
 */
// START CONFIGURATION...

// To avoid cross-site scripting questions, this demo should be in the
// same container as the OpenID Connect provider (OpenAM).
function getBaseURL() {
    var protocol = window.location.protocol;
    var hostname = window.location.hostname;
    var port = window.location.port;
    return protocol + "//" + hostname + ":" + port;
}
var server = getBaseURL();

// OpenAM is assumed to be deployed under /openam.
var openam = "/openam";
var authorize = "/oauth2/authorize";
// access_token is returned on successful authorization
var info = "/oauth2/userinfo";

// Client ID, redirect_uri, state
var openid = "/openid";
var client_id = "myClientID";
// client_secret is not used in the implicit profile
var redirect_uri = server + openid + "/cb-implicit.html";
var state = "af0ifjsldkj";
var nonce = "n-0S6_WzA2Mj";

// ...END CONFIGURATION

// http://stackoverflow.com/ has lots of useful snippets...
function encodeQueryData(data) {
    var ret = [];
    for (var d in data) {
        ret.push(encodeURIComponent(d) + "="
            + encodeURIComponent(data[d]));
    }
    return ret.join("&");
}

function getParamsFromFragment() {
    var params = {};
    var postBody = location.hash.substring(1);
    var regex = /([^&=]+)=([^&]*)/g, m;
    while (m = regex.exec(postBody)) {
        params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }
    return params;
}

function parseQueryString() {
    var query = {};
    var args = document.location.search.substring(1).split('&');
    for (var arg in args)
    {
        var m = args[arg].split('=');
        query[decodeURIComponent(m[0])] = decodeURIComponent(m[1]);
    }

    return query;
}