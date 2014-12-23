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

var redirect_uri  = server + openid + "/cb-basic.html";
var state         = "af0ifjsldkj";

// ...END CONFIGURATION

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
