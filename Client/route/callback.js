// create the module
var forgerockApp = angular.module('forgerockApp', ['ngRoute', 'services']);
var services = angular.module('services', []);
var baseURL = document.URL.substr(0, document.URL.indexOf('/', document.URL.indexOf('/', 10) + 1));
var redirect_uri = baseURL  + "/Client/callback.html" ;


// configure our routes
forgerockApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider

    // route for the home page
    .when('/', {
        controller  : 'mainController',
        templateUrl : 'pages/callback.html'

    })
        .when('/access_token=:accessToken', {
            templateUrl : 'pages/callback.html',
            controller  : 'mainController'
        })

    ;
}]);


// create the controller and inject Angular's $scope
forgerockApp.controller('mainController', ['$scope', '$http', 'CallBack', function($scope, $http, CallBack) {
    $scope.baseURL = baseURL;

    $scope.parameters = parseQueryString()

    $scope.state = getParameterByName("state");
    if ($scope.state == "") {
        $scope.isAuthorizationCodeError = true
        $scope.error = "The state is not returned by OpenAM";
        return;
    }
    $scope.stateInfo = getStateInfo($scope.state);


    if ($scope.stateInfo.flow === authorizationCodeFlowID) {
        $scope.OAuth2Flow = "authorizationCodeFlow";
        $scope.parameters = parseQueryString()

        CallBack.authorizationCodeFlow($scope, $http);
    } else if( $scope.stateInfo.flow === implicitFlowID) {
        $scope.OAuth2Flow = "implicitFlow";
        $scope.parameters = getParamsFromFragment()
        $scope.parameters["access_token"] = $scope.parameters["/access_token"]
        delete $scope.parameters["/access_token"];
        CallBack.implicitFlow($scope, $http);
    } else {
        $scope.isAuthorizationCodeError = true
        $scope.error = "Couldn't read the original flow from the state";
        return;
    }
}]);


// Callback factory
services.factory('CallBack', function() {
    var callback = {};

    /**
     * Start the authorization Code flow callback.
     * We will analyse the values returned by OpenAM.
     * @param $scope
     * @param $http
     */
    callback.authorizationCodeFlow = function($scope, $http) {

        var grant_type = "authorization_code";
        $scope.isAuthorizationCodeError = false;

        // Get authorization code sent by OpenAM from the http GET parameters
        $scope.code = getParameterByName("code");

        // Checking if the code is not null.
        if ($scope.code == "") {
            // as the parameter 'code' is not set, it means that OpenAM had an error and the details would be in
            // the "error" parameter.
            $scope.isAuthorizationCodeError = true;
            $scope.error = JSON.stringify(parseQueryString(), undefined, 2);
            return;
        }

        // We will retrieve the configuration from the state. For the example, we stored the configuration id in the state
        $scope.config = getConfiguration("config/configurations.json", $scope.stateInfo.config);

        if (typeof($scope.config) == "undefined" || $scope.config == null) {
            // We can't retrieve the configuration: the state is incorrect.
            $scope.isAuthorizationCodeError = true;
            $scope.error = "Can't find configuration used '" + $scope.stateInfo.config + "'";
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
            data: "code=" + $scope.code + "&grant_type=" + grant_type + "&redirect_uri=" + redirect_uri
        };

        $scope.accessTokenRequest.url = $scope.config.openam_uri + access
        if ($scope.accessTokenRequest.parameters.length > 0) {
            $scope.accessTokenRequest.url += "?" + encodeQueryData()
        }

        // variables for the UI, to display the ajax request status
        $scope.accessTokenRequest.status = {};
        $scope.accessTokenRequest.status.isSent = false;
        $scope.warnings = [];

        // Function call when you click on the button for converting the authorization code into an access token
        $scope.askToken = function() {

            callback.callAccessTokenEndpoint($scope, $http);

            // Store the access token in the
            $scope.storeAccessTokenInCookie = function() {
                setCookie(accessTokenCookie, $scope.accessTokenRequest.response.access_token, 1);
                setCookie(refreshTokenCookie, $scope.accessTokenRequest.response.refresh_token, 1);
                setCookie(idtokenTokenCookie, $scope.accessTokenRequest.response.id_token, 1);
                setCookie(stateCookie, $scope.state, 1);

                $scope.cookieValues = {};
                $scope.cookieValues.accessToken = getCookie(accessTokenCookie);
                $scope.cookieValues.refreshToken = getCookie(refreshTokenCookie);
                $scope.cookieValues.idToken = getCookie(idtokenTokenCookie);
                $scope.cookieValues.state = getCookie(stateCookie);
            }
        }
    };

    /**
     * Start the implicit flow callback
     * This flow is easier as we directly receive the access token.
     * @param $scope
     * @param $http
     */
    callback.implicitFlow = function($scope, $http) {
        $scope.config = getConfiguration("config/configurations.json", $scope.stateInfo.config);

        if (typeof($scope.config) == "undefined" || $scope.config == null) {
            // We can't retrieve the configuration: the state is incorrect.
            $scope.isImplicitFlowError = true;
            $scope.error = "Can't find configuration used '" + $scope.stateInfo.config + "'";
            return;
        }

        $scope.accessTokenInfo = callback.analyseAccessTokenEndpointResponse($scope.parameters["scope"], $scope.parameters["id_token"],  $scope.config);


        $scope.storeAccessTokenInCookie = function() {
            setCookie(accessTokenCookie, $scope.parameters["access_token"], 1);
            setCookie(refreshTokenCookie, $scope.parameters["refresh_token"], 1);
            setCookie(idtokenTokenCookie, $scope.parameters["id_token"], 1);
            setCookie(stateCookie, $scope.state, 1);

            $scope.cookieValues = {};
            $scope.cookieValues.accessToken = getCookie(accessTokenCookie);
            $scope.cookieValues.refreshToken = getCookie(refreshTokenCookie);
            $scope.cookieValues.idToken = getCookie(idtokenTokenCookie);
            $scope.cookieValues.state = getCookie(stateCookie);
        }
    };

    /**
     * Call the access token endpoint
     * The $scope.accessTokenRequest needs to be initialize with all the ajax paramater.
     * @param $scope
     * @param $http
     */
    callback.callAccessTokenEndpoint = function($scope, $http) {

        $scope.accessTokenRequest.status.responseReceive = false;

        $http.post(
            $scope.accessTokenRequest.url,
            $scope.accessTokenRequest.data,
            $scope.accessTokenRequest.config).then(

            // The ajax request succeed
            function successCallback(response) {

                $scope.accessTokenRequest.status.responseReceive = true;
                $scope.accessTokenRequest.status.success = true;
                $scope.accessTokenRequest.response = response.data;
                console.log("Access token succeed. Returning :" + $scope.accessTokenRequest.response);

                $scope.accessTokenRequest.responseInfo = callback.analyseAccessTokenEndpointResponse( $scope.accessTokenRequest.response.scope, $scope.accessTokenRequest.response.id_token, $scope.config);
            },
            // The ajax request failed
            function errorCallback(response) {
                console.log("Access token failed. Returning :" + response.data);

                $scope.accessTokenRequest.status.responseReceive = true;
                $scope.accessTokenRequest.status.success = false;
                $scope.accessTokenRequest.response = "Access Token request failed (check your web browser console for more details) : " + JSON.stringify(response.data, undefined, 2);
                console.log("Access token failed. Returning :" + $scope.accessTokenRequest.error);

            });

        $scope.accessTokenRequest.status.isSent = true;
    };

    /**
     * Analyze the the result of the Access Token endpoint by OpenAM
     * @param scope
     * @param id_token
     * @param config
     * @returns {{}}
     */
    callback.analyseAccessTokenEndpointResponse = function(scope, id_token, config) {
        var info = {};
        info.warnings = [];

        // We check the scope returned
        try {
            if (scope != config.scope) {
                info.warnings.push("Invalid scope : " + scope +
                ",  '" + scope + "' != '" + config.scope + "'");
            }
        } catch(e) {
            info.warnings.push("An error occurred when parsing and checking the access token: " + e);
        }

        // All this part concerned the id token, that you can ask by adding "openid" in the scope
        info.isOpenid = config.scope.indexOf("openid") >= 0;

        if (info.isOpenid) {
            info.openidTokenInfo = callback.getOpenIDTokenInfo(id_token, config);
            info.warnings = info.warnings.concat(info.openidTokenInfo.warnings);
        }

        return info;
    }

    /**
     * Extract the ID token info from the encoded ID token
     * @param idTokenEncoded
     * @param config
     * @returns {{}}
     */
    callback.getOpenIDTokenInfo = function(idTokenEncoded, config) {

        var info = {};
        info.warnings = [];

        console.log("ID token encoded not split:" + idTokenEncoded);

        idTokenEncoded = idTokenEncoded.split(/\./);
        console.log("ID token encoded split:" + idTokenEncoded);

        // Decode the first part of the id token: the header
        try {
            info.idTokenDecodedHeader = JSON.parse(atob(idTokenEncoded[0]));
            console.log("ID token Header decoded :" + info.idTokenDecodedHeader);
        } catch (e) {
            info.warnings.push("An error occurred when parsing and checking the id token header: " + e);
        }

        // Decode the second part of the id token: the content
        try {
            info.idTokenDecodedContent = JSON.parse(atob(idTokenEncoded[1]));
            console.log("ID token Content decoded :" + info.idTokenDecodedContent);

            // We check that the information is coherent with the configuration

            // The issuer
            if (info.idTokenDecodedContent.iss != config.openam_uri) {
                info.warnings.push("Invalid id_token issuer: " + info.idTokenDecodedContent.iss +
                ",  '" + info.idTokenDecodedContent.iss + "' != '" + info.openam_uri + "'")
            }

            // The Client ID
            if (
                (
                info.idTokenDecodedContent.aud instanceof Array
                && info.idTokenDecodedContent.aud.indexOf(config.client_id) == -1
                )
                || (info.idTokenDecodedContent.aud != config.client_id)) {

                info.warnings.push("Invalid id_token audience: " + info.idTokenDecodedContent.aud +
                ",  '" + info.idTokenDecodedContent.iss + "' != '" + config.client_id + "'")
            }

            if (info.idTokenDecodedContent.aud instanceof Array
                && info.idTokenDecodedContent.azp != config.client_id) {
                info.warnings.push("Invalid id_token authorized party: " + info.idTokenDecodedContent.azp +
                ",  '" + info.idTokenDecodedContent.azp + "' != '" + config.client_id + "'");
            }

            // The expiration time
            var now = new Date().getTime() / 1000;
            if (now >= result.idTokenDecodedContent.exp) {
                info.warnings.push("The id_token has expired.");
            }

            if (now < result.idTokenDecodedContent.iat) {
                info.warnings.push("The id_token was issued in the future.");
            }
        } catch (e) {
            info.warnings.push("An error occurred when parsing and checking the id token content: " + e);
        }

        // Decode the last part of the id token: the signature
        try {
            info.idTokenSignature = idTokenEncoded[2];
            console.log("ID token Signature :" + info.idTokenSignature);

            info.isValidSignature = validateSignature(idTokenEncoded[0], idTokenEncoded[1], info.idTokenSignature);
            if (info.isValidSignature) {
                info.warnings.push("Invalid ID token signature");
            }
        } catch (e) {
            info.warnings.push("An error occurred when parsing and checking the id token signature: " + e);
        }
        return info;
    }

    return callback;
});



// The following code is for validating the id token signature

forgerockApp.factory('idTokenValidator', [function () {
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

forgerockApp.controller('validateCtrl', [
    'idTokenValidator',
    function (idTokenValidator) {
        var vm = this;
        vm.result = '';

        vm.validateWithCert = function (token, certificate) {
            vm.result = idTokenValidator.validateToken(token, certificate);
        };
    }
]);
