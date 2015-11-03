	// create the module and name it scotchApp
	var scotchApp = angular.module('scotchApp', ['ngRoute']);

	// configure our routes
	scotchApp.config(function($routeProvider) {
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

    scotchApp.controller('resourcesController', function($scope, $http){

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
    scotchApp.controller('mainController', function($scope) {
    });

