	// create the module and name it scotchApp
	var scotchApp = angular.module('scotchApp', ['ngRoute']);
    var baseURL = document.URL.substr(0, document.URL.indexOf('/', document.URL.indexOf('/', 10) + 1));

	// configure our routes
	scotchApp.config(function($routeProvider) {
		$routeProvider

			// route for the home page
			.when('/', {
				templateUrl : 'pages/home.html',
				controller  : 'mainController'
			})
            // route for the Authorization Code flow
            .when('/UserInfo', {
                templateUrl : 'pages/userInfo.html',
                controller  : 'userInfoController'
            })

            // route for the Authorization Code flow
            .when('/AuthorizationCodeFlow', {
                templateUrl : 'pages/AuthorizationCodeFlow.html',
                controller  : 'configController'
            })

            // route for the contact page
            .when('/AuthorizationCodeOpenIDFlow', {
                templateUrl : 'pages/AuthorizationCodeOpenIDFlow.html',
                controller  : 'configController'
            });


	});

    scotchApp.controller('configController', function($scope, $http){

        $scope.baseURL = baseURL;
        console.log("base URL: " + $scope.baseURL);
        $scope.resourceProviderURL = $scope.baseURL + "/index.html";


        $scope.configurations = null;
        $http.get('config/configurations.json')
            .success(function(data) {
                $.each(data.configurations, function(key, config) {

                    if (config.redirect_uri.substring(0, 4) != "http") {
                        config.redirect_uri = $scope.baseURL  + "/" + config.redirect_uri;
                    }
                    var authRequestParameters = {
                        "response_type": "code",
                        "client_id": config.client_id,
                        "realm": config.realm,
                        "scope": config.scope,
                        "redirect_uri": config.redirect_uri,
                        "state": config.state
                    };
                    var url = config.openam_uri + authorize + "?" + encodeQueryData(authRequestParameters);

                    config.authorizationFlowURL = url;
                });

                $scope.configurations = data;
            })
            .error(function(data,status,error,config){
                $scope.configurations = [{heading:"Error",description:"Could not load json   data"}];
            });

    });

	// create the controller and inject Angular's $scope
	scotchApp.controller('mainController', function($scope) {
        $scope.baseURL = baseURL;

	});

    // create the controller and inject Angular's $scope
    scotchApp.controller('userInfoController', function($scope, $http) {
        $scope.baseURL = baseURL;

        $scope.accessToken = getCookie(accessTokenCookie);
        $scope.state = getCookie(stateCookie);
        $scope.isError = false

        if ($scope.accessToken == "" || $scope.state == "") {
            $scope.isError = true
            $scope.error = "The access token or the configuration used are not available.";
            return;
        }

        $scope.config = getConfiguration("config/configurations.json", $scope.state);
        console.log( $scope.config);

        if (typeof($scope.config) == "undefined" || $scope.config == null) {
            // We can't retrieve the configuration: the state is incorrect.
            $scope.isAuthorizationCodeError = true;
            $scope.error = "Can't find configuration used for state '" + $scope.state + "'";
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
