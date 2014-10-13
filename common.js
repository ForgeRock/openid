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
    var port = window.location.port;
    return protocol + "//" + hostname + ":" + port;
}
var server = getBaseURL();

// OpenAM is assumed to be deployed under /openam.
var openam = "/openam";
var authorize = "/oauth2/authorize";
var access = "/oauth2/access_token";
var info = "/oauth2/userinfo";

// This application's URI, client_id, client_secret.
var openid = "/openid";
var client_id = "myClientID";
var client_secret = "password";

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

/* Validates a JWS signature according to
   https://tools.ietf.org/html/draft-ietf-jose-json-web-signature-33#section-5.2. */
function validateSignature(header, payload, signature) {
  var encodedHeader  = tob64u(encode_utf8(JSON.stringify(header)));
  console.log(encodedHeader);
  var encodedPayload = tob64u(JSON.stringify(payload));
  console.log(encodedPayload);
  var signingInput   = encodedHeader + "." + encodedPayload;
  console.log(signingInput);
  var signed         = CryptoJS.HmacSHA256(signingInput, client_secret);
  var encodedSigned  = b64tob64u(signed.toString(CryptoJS.enc.Base64));
  console.log(encodedSigned);
  console.log(signature);
  return encodedSigned == signature;
}

/* Returns a base64url-encoded version of the input string. */
function tob64u(string) {
    var result = btoa(string);
    result = result.replace(/\+/g, "-");
    result = result.replace(/\//g, "_");
    result = result.replace(/=/g, "");
    return result;
}

/* Returns a base64url-encoded version of the base64-encoded input string. */
function b64tob64u(string) {
    var result = string;
    result = result.replace(/\+/g, "-");
    result = result.replace(/\//g, "_");
    result = result.replace(/=/g, "");
    return result;
}

// The following functions are from
// http://ecmanaut.blogspot.fr/2006/07/encoding-decoding-utf8-in-javascript.html.

/* Encodes a string as UTF-8. */
function encode_utf8(s) {
  return unescape(encodeURIComponent(s));
}

/* Decodes a UTF-8 string. */
function decode_utf8(s) {
  return decodeURIComponent(escape(s));
}
