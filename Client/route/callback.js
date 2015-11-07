// create the module
var forgerockApp = angular.module('forgerockApp', ['ngRoute', 'services']);
var baseURL = document.URL.substr(0, document.URL.indexOf('/', document.URL.indexOf('/', 10) + 1));
var redirect_uri = baseURL  + "/Client/callback.html" ;
var services = angular.module('services', []);


// configure our routes
forgerockApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider

    // route for the home page
    .when('/', {
            templateUrl : 'pages/AuthorizationCodeFlowCallback.html',
            controller  : 'mainController'

    })
    .when('/access_token=:accessToken', {
            templateUrl : 'pages/ImplicitFlowCallback.html',
            controller  : 'implicitFlowController'
    })

    ;
}]);


// create the controller and inject Angular's $scope
forgerockApp.controller('mainController', ['$scope', '$http', 'CallBack', function($scope, $http, CallBack) {
    $scope.baseURL = baseURL;

    $scope.OAuth2Flow = "authorizationCodeFlow";
    $scope.parameters = parseQueryString()
    $scope.state = getParameterByName("state");
    if ($scope.state == "") {
        $scope.isAuthorizationCodeError = true
        $scope.error = "The state is not returned by OpenAM";
        return;
    }
    $scope.stateInfo = getStateInfo($scope.state);

    CallBack.authorizationCodeFlow($scope, $http);

}]);

// create the controller and inject Angular's $scope
forgerockApp.controller('implicitFlowController', ['$scope', '$http', 'CallBack', function($scope, $http, CallBack) {
    $scope.baseURL = baseURL;

    $scope.OAuth2Flow = "implicitFlow";
    $scope.parameters = getParamsFromFragment()
    $scope.parameters["access_token"] = $scope.parameters["/access_token"]
    delete $scope.parameters["/access_token"];

    $scope.state = $scope.parameters["state"];
    if ($scope.state == "") {
        $scope.isAuthorizationCodeError = true
        $scope.error = "The state is not returned by OpenAM";
        return;
    }
    $scope.stateInfo = getStateInfo($scope.state);
    CallBack.implicitFlow($scope, $http);

}]);


// Callback factory
services.factory('CallBack', ['AccessToken', function(AccessToken) {

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
            AccessToken.callAccessTokenEndpoint($scope, $http);
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

        $scope.accessTokenInfo = AccessToken.analyseAccessTokenEndpointResponse($scope.parameters["scope"], $scope.parameters["id_token"],  $scope.config);

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

    return callback;
}]);



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
