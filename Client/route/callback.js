// create the module
var app = angular.module('scotchApp', ['ngRoute']);
var baseURL = document.URL.substr(0, document.URL.indexOf('/', document.URL.indexOf('/', 10) + 1));

// configure our routes
app.config(function($routeProvider) {
    $routeProvider

        // route for the home page
        .when('/', {
            controller  : 'mainController',
            templateUrl : 'pages/callback.html'

        })

});


// create the controller and inject Angular's $scope
app.controller('mainController', function($scope, $http) {

    $scope.baseURL = baseURL;


    var grant_type = "authorization_code";
    $scope.isAuthorizationCodeError = false;

    // Get variables sent by OpenAM from the http GET parameters
    $scope.code = getParameterByName("code");
    $scope.state = getParameterByName("state");

    // Checking the parameters
    if ($scope.code == "" || $scope.state == "") {
        $scope.isAuthorizationCodeError = true
        $scope.error = JSON.stringify(parseQueryString(), undefined, 2);
        return;
    }

    //Retrieve the parameters from the state. It's an example of the "state" usage, retrieve configuration is arbitrary.
    $scope.config = getConfiguration("config/configurations.json", $scope.state);
    console.log( $scope.config);

    if (typeof($scope.config) == "undefined" || $scope.config == null) {
        // We can't retrieve the configuration: the state is incorrect.
        $scope.isAuthorizationCodeError = true;
        $scope.error = "Can't find configuration used for state '" + $scope.state + "'";
        return;
    }

    // Pre-configuration of the Ajax request, for converting the authorization code into the access token
    $scope.accessTokenRequest = {
        "name": "Get Access token from Authorization code",
        type: "POST",
        baseURL: $scope.config.openam_uri,
        endpoint: access,
        parameters: [],
        config: {
            headers: {
                "Authorization":  authHeader($scope.config.client_id, $scope.config.client_secret),
                'Accept': 'application/x-www-form-urlencoded',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        },
        data: "code=" + $scope.code + "&grant_type=" + grant_type + "&redirect_uri=" + $scope.config.redirect_uri
    };

    $scope.accessTokenRequest.url = $scope.config.openam_uri + access
    if ($scope.accessTokenRequest.parameters.length > 0) {
        $scope.accessTokenRequest.url += "?" + encodeQueryData()
    }

    // variables for the UI, to display the ajax request status
    $scope.accessTokenRequest.status = {};
    $scope.accessTokenRequest.status.isSent = false;
    $scope.warnings = [];

    // Function call when you click on the button for running the ajax request
    $scope.askToken = function() {
        $scope.accessTokenRequest.status.responseReceive = false;

        $http.post(
            $scope.accessTokenRequest.url,
            $scope.accessTokenRequest.data,
            $scope.accessTokenRequest.config).then(

            // The ajax request succeed
            function successCallback(response) {

                $scope.accessTokenRequest.status.responseReceive = true;
                $scope.responseFromAccessToken = response.data;
                console.log("Access token succeed. Returning :" + $scope.responseFromAccessToken);

                // We check the scope returned
                try {
                    if ($scope.responseFromAccessToken.scope != $scope.config.scope) {
                        $scope.warnings.push("Invalid scope : " + $scope.responseFromAccessToken.scope +
                        ",  '" + $scope.responseFromAccessToken.scope + "' != '" + $scope.config.scope + "'");
                    }
                } catch(e) {
                    $scope.warnings.push("An error occurred when parsing and checking the access token: " + e);
                }

                // All this part concerned the id token, that you can ask by adding "openid" in the scope

                $scope.isOpenid = $scope.config.scope.indexOf("openid") >= 0;

                if ($scope.isOpenid) {
                    $scope.idTokenEncoded = response.data.id_token;
                    console.log("ID token encoded not splited:" + $scope.idTokenEncoded);

                    $scope.idTokenEncoded = $scope.idTokenEncoded.split(/\./);
                    console.log("ID token encoded splited:" + $scope.idTokenEncoded);

                    // Decode the first part of the id token: the header
                    try {
                        $scope.idTokenDecodedHeader = JSON.parse(atob($scope.idTokenEncoded[0]));
                        console.log("ID token Header decoded :" + $scope.idTokenDecodedHeader);
                    } catch (e) {
                        $scope.warnings.push("An error occurred when parsing and checking the id token header: " + e);
                    }

                    // Decode the second part of the id token: the content
                    try {
                        $scope.idTokenDecodedContent = JSON.parse(atob($scope.idTokenEncoded[1]));
                        console.log("ID token Content decoded :" + $scope.idTokenDecodedContent);

                        // We check that the information is coherent with the configuration

                        // The issuer
                        if ($scope.idTokenDecodedContent.iss != $scope.config.openam_uri) {
                            $scope.warnings.push("Invalid id_token issuer: " + $scope.idTokenDecodedContent.iss +
                            ",  '" + $scope.idTokenDecodedContent.iss + "' != '" + $scope.config.openam_uri + "'")
                        }

                        // The Client ID
                        if (
                            (
                            $scope.idTokenDecodedContent.aud instanceof Array
                            && $scope.idTokenDecodedContent.aud.indexOf($scope.config.client_id) == -1
                            )
                            || ($scope.idTokenDecodedContent.aud != $scope.config.client_id)) {

                            $scope.warnings.push("Invalid id_token audience: " + $scope.idTokenDecodedContent.aud +
                            ",  '" + $scope.idTokenDecodedContent.iss + "' != '" + $scope.config.client_id + "'")
                        }

                        if ($scope.idTokenDecodedContent.aud instanceof Array
                            && $scope.idTokenDecodedContent.azp != $scope.config.client_id) {
                            $scope.warnings.push("Invalid id_token authorized party: " + $scope.idTokenDecodedContent.azp +
                            ",  '" + $scope.idTokenDecodedContent.azp + "' != '" + $scope.config.client_id + "'");
                        }

                        // The expiration time
                        var now = new Date().getTime() / 1000;
                        if (now >= $scope.idTokenDecodedContent.exp) {
                            $scope.warnings.push("The id_token has expired.");
                        }

                        if (now < $scope.idTokenDecodedContent.iat) {
                            $scope.warnings.push("The id_token was issued in the future.");
                        }
                    } catch (e) {
                        $scope.warnings.push("An error occurred when parsing and checking the id token content: " + e);
                    }

                    // Decode the last part of the id token: the signature
                    try {
                        $scope.idTokenSignature = $scope.idTokenEncoded[2];
                        console.log("ID token Signature decoded :" + $scope.idTokenDecodedSignature);

                        $scope.isValidSignature = validateSignature($scope.idTokenEncoded[0], $scope.idTokenEncoded[1], $scope.idTokenSignature);
                        if ($scope.isValidSignature) {
                            $scope.warnings.push("Invalid ID token signature");
                        }
                    } catch (e) {
                        $scope.warnings.push("An error occurred when parsing and checking the id token signature: " + e);
                    }
                }
            },
            // The ajax request failed
            function errorCallback(response) {
                console.log("Access token failed. Returning :" + response.data);

                $scope.accessTokenRequest.status.responseReceive = true;

                $scope.isAccessTokenError = true;
                $scope.error = "Access Token request failed (check your web browser console for more details) : " + JSON.stringify(response.data, undefined, 2);
                console.log("Access token failed. Returning :" + $scope.error);

            });

        $scope.accessTokenRequest.status.isSent = true;

        // Store the access token in the
        $scope.storeAccessTokenInCookie = function() {
            setCookie(accessTokenCookie, $scope.responseFromAccessToken.access_token, 1);
            setCookie(refreshTokenCookie, $scope.responseFromAccessToken.refresh_token, 1);
            setCookie(idtokenTokenCookie, $scope.responseFromAccessToken.id_token, 1);
            setCookie(stateCookie, $scope.state, 1);

            $scope.cookieValues = {};
            $scope.cookieValues.accessToken = getCookie(accessTokenCookie);
            $scope.cookieValues.refreshToken = getCookie(refreshTokenCookie);
            $scope.cookieValues.idToken = getCookie(idtokenTokenCookie);
            $scope.cookieValues.state = getCookie(stateCookie);
        }
    }

});

// The following code is for validating the id token signature

app.factory('idTokenValidator', [function () {
    return {
        validateToken: validateToken
    };

    function validateToken(id_token, cert) {
        var jws = new KJUR.jws.JWS();
        var result = jws.verifyJWSByPemX509Cert(id_token, cert);
        if (result) {
            result = JSON.parse(jws.parsedJWS.payloadS);
        } else {
            result = 'unable to verify token';
        }

        return result;
    }

}]);

app.controller('validateCtrl', [
    'idTokenValidator',
    function (idTokenValidator) {
        var vm = this;
        vm.result = '';

        vm.validateWithCert = function (token, certificate) {
            vm.result = idTokenValidator.validateToken(token, certificate);
        };
    }
]);
