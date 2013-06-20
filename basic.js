// START CONFIGURATION...

// In theory, you MUST protect the transport.
function getBaseURL() {
    var protocol = window.location.protocol;
    var hostname = window.location.hostname;
    var port = window.location.port;
    return protocol + "//" + hostname + ":" + port;
}
var server = getBaseURL();

// OpenAM deployed under /openam
var openam = "/openam";
var authorize = "/oauth2/authorize";
var access = "/oauth2/access_token";
var info = "/oauth2/tokeninfo"; // Wrong endpoint for OpenID Connect?

// Client ID, secret, redirect, state
var openid = "/openid";
var client_id = "myClientID";
var client_secret = "password";
var redirect_uri = server + openid + "/cb.html";
var state = 1234;

var params = {
    "response_type": "code",
    "scope": "openid",
    "client_id": client_id,
    "redirect_uri": redirect_uri,
    "state": state
};

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
    if(results == null)
        return "";
    else
        return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function authHeader(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return "Basic " + hash;
}
