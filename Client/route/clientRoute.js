// create the module and name it scotchApp
var forgerockApp = angular.module('forgerockApp', ['ngRoute', 'services']);
var baseURL = document.URL.substr(0, document.URL.indexOf('/', document.URL.indexOf('/', 10) + 1));
var services = angular.module('services', []);

// configure our routes
forgerockApp
    .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
        $routeProvider

            // route for the home page
            .when('/', {
                templateUrl : 'pages/home.html',
                controller  : 'mainController'
            })


            // route for the Authorization Code flow
            .when( '/AuthorizationCodeFlow', {
                templateUrl : 'pages/AuthorizationCodeFlow.html',
                controller  : 'AuthorizationCodeFlowController'
            })

            // route for The implicit flow
            .when('/ImplicitFlow', {
                templateUrl : 'pages/ImplicitFlow.html',
                controller  : 'ImplicitFlowController'
            })

            // route for The implicit flow
            .when('/PasswordGrantFlow', {
                templateUrl : 'pages/PasswordGrantFlow.html',
                controller  : 'PasswordGrantFlowController'
            })

            // route for the user info
            .when('/UserInfo', {
                templateUrl : 'pages/userInfo.html',
                controller  : 'userInfoController'
            })
        ;

    }]);


// The default controller
forgerockApp.controller('mainController', function($scope, $http) {
    $scope.baseURL = baseURL;


});


forgerockApp.controller('AuthorizationCodeFlowController', function($scope, $http){

    $scope.baseURL = baseURL;
    console.log("base URL: " + $scope.baseURL);
    $scope.resourceProviderURL = $scope.baseURL + "/index.html";


    $scope.configurations = null;
    $http.get('config/configurations.json')
        .success(function(data) {
            $.each(data.configurations, function(key, config) {

                var redirect_uri = $scope.baseURL  + "/Client/callback.html" ;

                var authRequestParameters = {
                    "response_type": "code",
                    "client_id": config.client_id,
                    "realm": config.realm,
                    "scope": config.scope,
                    "redirect_uri": redirect_uri,
                    "state": getState(config, authorizationCodeFlowID)
                };
                var url = config.openam_uri + authorize + "?" + encodeQueryData(authRequestParameters);

                config.flowURL = url;
            });

            $scope.configurations = data;
        })
        .error(function(data,status,error,config){
            $scope.configurations = [{heading:"Error",description:"Could not load json   data"}];
        });

});

forgerockApp.controller('ImplicitFlowController', function($scope, $http){

    $scope.baseURL = baseURL;
    console.log("base URL: " + $scope.baseURL);
    $scope.resourceProviderURL = $scope.baseURL + "/index.html";


    $scope.configurations = null;
    $http.get('config/configurations.json')
        .success(function(data) {
            $.each(data.configurations, function(key, config) {

                var redirect_uri = $scope.baseURL  + "/Client/callback.html" ;

                var authRequestParameters = {
                    "response_type": "id_token token",
                    "client_id": config.client_id,
                    "realm": config.realm,
                    "scope": config.scope,
                    "redirect_uri":redirect_uri,
                    "state": getState(config, implicitFlowID)
                };
                var url = config.openam_uri + authorize + "?" + encodeQueryData(authRequestParameters);

                config.flowURL = url;
            });

            $scope.configurations = data;
        })
        .error(function(data,status,error,config){
            $scope.configurations = [{heading:"Error",description:"Could not load json   data"}];
        });

});

forgerockApp.controller('PasswordGrantFlowController', ['$scope', '$http', 'AccessToken',  function($scope, $http, AccessToken){
    $scope.baseURL = baseURL;

    $scope.configurations = null;
    $http.get('config/configurations.json')
        .success(function(data) {
            $scope.configurations = data;
        })
        .error(function(data,status,error,config){
            $scope.configurations = [{heading:"Error",description:"Could not load json   data"}];
        });

    $scope.startFlow = function(configID) {
        $scope.config = getConfiguration("config/configurations.json", configID);

        $scope.state = getState($scope.config, passwordGrantFlowID)
        $scope.accessTokenRequest = {
            name: "Password Grant flow request",
            type: "POST",
            baseURL: $scope.config.openam_uri,
            endpoint: access,
            url: $scope.config.openam_uri + access,
            parameters: [],
            config: {
                headers: {
                    "Authorization": authHeader($scope.config.client_id, $scope.config.client_secret),
                    "Accept": "application/x-www-form-urlencoded",
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            },
            data: "grant_type=password&username=" + $scope.config.username + "&password=" + $scope.config.password
            + "&scope=" + $scope.config.scope + ""
        };
        // variables for the UI, to display the ajax request status
        $scope.accessTokenRequest.status = {};
        $scope.accessTokenRequest.status.isSent = false;
        $scope.warnings = [];


        AccessToken.callAccessTokenEndpoint($scope, $http)


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

}]);

// create the controller and inject Angular's $scope
forgerockApp.controller('userInfoController', function($scope, $http) {
    $scope.baseURL = baseURL;

    $scope.accessToken = getCookie(accessTokenCookie);
    $scope.state = getCookie(stateCookie);
    $scope.isError = false

    if ($scope.accessToken == "" || $scope.state == "") {
        $scope.isError = true
        $scope.error = "The access token or the configuration used are not available.";
        return;
    }
    $scope.stateInfo = getStateInfo($scope.state);

    $scope.config = getConfiguration("config/configurations.json", $scope.stateInfo.config);
    console.log( $scope.config);

    if (typeof($scope.config) == "undefined" || $scope.config == null) {
        // We can't retrieve the configuration: the state is incorrect.
        $scope.isAuthorizationCodeError = true;
        $scope.error = "Can't find configuration '" + $scope.stateInfo.config + "'";
        return;
    }

    $scope.userInfoRequest = {
        "name": "Get User info from access token",
        type: "GET",
        baseURL: $scope.config.openam_uri,
        endpoint: info,
        url: $scope.config.openam_uri + info,
        parameters: [],
        config: {
            headers: {
                "Authorization": "Bearer " + $scope.accessToken
            }
        },
        data: ""
    };
    // variables for the UI, to display the ajax request status
    $scope.userInfoRequest.status = {};
    $scope.userInfoRequest.status.isSent = false;
    $scope.isUserInfoError = false;

    // create a message to display in our view
    // Function call when you click on the button for running the ajax request
    $scope.askUserInfo = function() {
        $scope.userInfoRequest.status.responseReceive = false;

        $http.post(
            $scope.userInfoRequest.url,
            $scope.userInfoRequest.data,
            $scope.userInfoRequest.config).then(

            // The ajax request succeed
            function successCallback(response) {

                $scope.userInfoRequest.status.responseReceive = true;
                $scope.responseFromUserInfo = response.data;
                console.log("Access token succeed. Returning :" + JSON.stringify($scope.responseFromUserInfo, undefined, 2));

            },
            // The ajax request failed
            function errorCallback(response) {
                console.log("Access token failed. Returning :" + response.data);

                $scope.userInfoRequest.status.responseReceive = true;

                $scope.isUserInfoError = true;
                $scope.error = "Access Token request failed (check your web browser console for more details) : " + JSON.stringify(response.data, undefined, 2);
                console.log("Access token failed. Returning :" + $scope.error);

            }
        );
        $scope.userInfoRequest.status.isSent = true;
    }
});

services.factory('AccessToken', function() {
    var accessTokenFactory = {};

    /**
     * Call the access token endpoint
     * The $scope.accessTokenRequest needs to be initialize with all the ajax paramater.
     * @param $scope
     * @param $http
     */
    accessTokenFactory.callAccessTokenEndpoint = function($scope, $http) {

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

                $scope.accessTokenRequest.responseInfo = accessTokenFactory.analyseAccessTokenEndpointResponse( $scope.accessTokenRequest.response.scope, $scope.accessTokenRequest.response.id_token, $scope.config);
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
    accessTokenFactory.analyseAccessTokenEndpointResponse = function(scope, id_token, config) {
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
            info.openidTokenInfo = accessTokenFactory.getOpenIDTokenInfo(id_token, config);
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
    accessTokenFactory.getOpenIDTokenInfo = function(idTokenEncoded, config) {

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

    return accessTokenFactory;
});
