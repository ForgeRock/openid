/*
 * Copyright 2013-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
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
