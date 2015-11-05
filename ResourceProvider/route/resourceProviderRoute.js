	// create the module and name it scotchApp
	var forgerockApp = angular.module('forgerockApp', ['ngRoute']);

	// configure our routes
    forgerockApp.config(function($routeProvider) {
		$routeProvider

            // route for the home page
            .when('/', {
                templateUrl : 'ResourceProviderPages/home.html',
                controller  : 'mainController'
            })

			// route for the home page
			.when('/resources', {
				templateUrl : 'pages/resources.html',
				controller  : 'resourcesController'
			});


    });

    forgerockApp.controller('resourcesController', function($scope, $http){

        $scope.configurations = null;
        $http.get('resources/resources.json')
            .success(function(data) {
                $scope.resources = data;
            })
            .error(function(data,status,error,config){
                $scope.resources = [{heading:"Error",description:"Could not load json   data"}];
            });

    });

    // create the controller and inject Angular's $scope
    forgerockApp.controller('mainController', function($scope) {
    });

