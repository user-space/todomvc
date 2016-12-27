/*global angular */

/**
 * The main TodoMVC app module
 *
 * @type {angular.Module}
 */
angular.module('todomvc', ['ngRoute', 'ngResource'])
	.config(function ($routeProvider) {
		'use strict';

		var routeConfig = {
			controller: 'TodoCtrl',
			templateUrl: 'todomvc-index.html',
			resolve: {
				store: function (todoStorage) {
					// Get the correct module (API or localStorage).
					return todoStorage.then(function (module) {
						module.get(); // Fetch the todo records in the background.
						return module;
					});
				}
			}
		};

		try {
				//1. get new token or previous one
				var token = (window.location.search.match(/[\?&]token=([a-zA-Z0-9\.\-\_]+)[#&]?/) || []).pop() || localStorage.id_token
				if (!token) throw Error('no token')
				var payload = JSON.parse(atob(token.split('.')[1]))
				//2. get payload and check it didnt expired
				if (payload.exp < Math.round(Date.now() / 1000)) throw Error('token expired')
		} catch (ex) {
				delete localStorage.id_token
				//error. redirect to the login page if we dont have a valid token
				window.location = `https://gateway.user.space/sign/${btoa(window.location.origin + window.location.pathname)}`
		}
		//3. save token
		localStorage.id_token = token

		$routeProvider
			.when('/', routeConfig)
			.when('/:status', routeConfig)
			.otherwise({
				redirectTo: '/'
			});
	});
