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
var access = "/oauth2/access_token";
var info = "/oauth2/tokeninfo"; // Wrong endpoint for OpenID Connect?

// Client ID, secret, redirect_uri, state
var openid = "/openid";
var client_id = "myClientID";
var client_secret = "password";
var redirect_uri = server + openid + "/cb.html";
var state = 1234;

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

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results == null)
        return "";
    else
        return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function authHeader(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok); // Default: bXlDbGllbnRJRDpwYXNzd29yZA==
    // console.log("hash: " + hash);
    return "Basic " + hash;
}
