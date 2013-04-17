// START CONFIGURATION...

// In theory, you MUST protect the transport.
var proto = "http";
var host = "openam.example.com";
var port = 8080;

var server = proto + "://" + host + ":" + port;

// OpenAM deployed under /openam
var openam = "/openam";
var authorize = "/oauth2/authorize";
var access = "/oauth2/access_token";
var info = "/oauth2/tokeninfo"; // Wrong endpoint for OpenID Connect?

// Client ID, secret, and redirect
var client_id = "myClientID";
var client_secret = "password";
var redirect_uri = server + "/openid/cb.html";

var params = {
    "response_type": "code",
    "scope": "openid profile",
    "client_id": client_id,
    "redirect_uri": redirect_uri,
    "state": 1234
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
