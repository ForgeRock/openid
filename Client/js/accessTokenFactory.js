// Callback factory
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
