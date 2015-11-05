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
 *     Copyright 2013-2014 ForgeRock AS
 *
 */
// START CONFIGURATION...

// To avoid cross-site scripting questions,
// this demo should be in the same container
// as the OpenID Connect provider (OpenAM).
function getBaseURL() {
    var protocol = window.location.protocol;
    var hostname = window.location.hostname;
    var port     = window.location.port;
    return protocol + "//" + hostname + ":" + port;
}

var server        = getBaseURL();

// OpenAM is assumed to be deployed under /openam.
var openam        = "/openam";
var authorize     = "/oauth2/authorize";
var access        = "/oauth2/access_token";
var info          = "/oauth2/userinfo";

// Cookies used for this sample
var accessTokenCookie="accessTokenOpenAM";
var refreshTokenCookie="refreshTokenOpenAM";
var idtokenTokenCookie="idTokenTokenOpenAM";
var stateCookie="stateOpenAM";

//different flows
var authorizationCodeFlowID = "AC";
var implicitFlowID = "I";
var passwordGrantFlowID = "PG";
var credentialGrantFlowID = "P";

/* Returns the value of the named query string parameter. */
function getParameterByName(name) {
    name        = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS  = "[\\?&]" + name + "=([^&#]*)";
    var regex   = new RegExp(regexS);
    var results = regex.exec(window.location.search);

    if (results == null) {
        return "";
    }

    return decodeURIComponent(results[1].replace(/\+/g, " "));
}

/* Returns an HTTP Basic Authentication header string. */
function authHeader(user, password) {
    var tok  = user + ':' + password;
    var hash = btoa(tok); // Default: bXlDbGllbnRJRDpwYXNzd29yZA==
    // console.log("hash: " + hash);
    return "Basic " + hash;
}

function getConfiguration(configurationJson, id) {

    var result;

    $.ajax({
        url: configurationJson,
        dataType: 'json',
        async: false,
        success: function(data) {

            $.each(data.configurations, function(key, config) {

                if (config.id == id) {

                    result =  config;
                    return;
                }
            });
            if ( typeof(result) == "undefined" || result == null ) {
                console.log("config '" + id + "' not found.");
            }
        }
    });

    return result;
}

function getStateInfo(state) {
    var stateSplit = state.split(".");
    return  {
        "config": stateSplit[0],
        "flow": stateSplit[1]
    };
}

function getState(config, flow) {
    return config.id + "." + flow;
}



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

/* Returns a map of query string parameters. */
function parseQueryString() {
    var query = {};
    var args  = document.location.search.substring(1).split('&');
    for (var arg in args) {
        var m = args[arg].split('=');
        query[decodeURIComponent(m[0])] = decodeURIComponent(m[1]);
    }

    return query;
}

/* Validates a JWS signature according to
   https://tools.ietf.org/html/draft-ietf-jose-json-web-signature-33#section-5.2
   cheating a bit by taking the pre-encoded header and payload.
 */
function validateSignature(encodedHeader, encodedPayload, signature) {
  var signingInput   = encodedHeader + "." + encodedPayload;
  var signed         = CryptoJS.HmacSHA256(signingInput, client_secret);
  var encodedSigned  = b64tob64u(signed.toString(CryptoJS.enc.Base64));
  return encodedSigned == signature;
}

/* Returns a base64url-encoded version of the base64-encoded input string. */
function b64tob64u(string) {
    var result = string;
    result = result.replace(/\+/g, "-");
    result = result.replace(/\//g, "_");
    result = result.replace(/=/g, "");
    return result;
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

function checkCookie() {
    var user = getCookie("username");
    if (user != "") {
        alert("Welcome again " + user);
    } else {
        user = prompt("Please enter your name:", "");
        if (user != "" && user != null) {
            setCookie("username", user, 365);
        }
    }
}
