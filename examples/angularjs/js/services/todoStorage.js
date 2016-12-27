/*global angular */

/**
 * Services that persists and retrieves todos from localStorage or a backend API
 * if available.
 *
 * They both follow the same API, returning promises for all changes to the
 * model.
 */
angular.module('todomvc')
	.factory('todoStorage', function ($http, $injector) {
		'use strict';

		// Detect if an API backend is present. If so, return the API module, else
		// hand off the localStorage adapter
		return $http.get('https://gateway.user.space/parse/classes/ToDo', {headers: {'Authorization': `Bearer ${localStorage.id_token}`}})
			.then(function () {
				return $injector.get('api');
			}, function () {
				return $injector.get('localStorage');
			});
	})

	.factory('api', function ($resource) {
		'use strict';

		var store = {
			todos: [],

			//send all request to user.space gateway with the login token
			api: $resource('https://gateway.user.space/parse/classes/ToDo/:id', null,
				{
					save:   {headers: {'Authorization': `Bearer ${localStorage.id_token}`}, method: 'POST'},
					query:  {headers: {'Authorization': `Bearer ${localStorage.id_token}`}},
					update: {headers: {'Authorization': `Bearer ${localStorage.id_token}`}, method: 'POST', transformRequest : function(data) {
						// remove attributes that we dont want to update
						return angular.toJson( Object.assign({}, data, {'_method' : 'PUT', createdAt: undefined, updatedAt: undefined, objectId: undefined}) );
					}},
					delete: {headers: {'Authorization': `Bearer ${localStorage.id_token}`}, method: 'DELETE'}
				}
			),

			clearCompleted: function () {
				var originalTodos = store.todos.slice(0);

				var incompleteTodos = store.todos.filter(function (todo) {
					if (todo.completed) store.api.delete({id : todo.objectId})
					return !todo.completed;
				});

				return angular.copy(incompleteTodos, store.todos);
			},

			delete: function (todo) {
				var originalTodos = store.todos.slice(0);

				store.todos.splice(store.todos.indexOf(todo), 1);
				return store.api.delete({ id: todo.objectId },
					function () {
					}, function error() {
						angular.copy(originalTodos, store.todos);
					});
			},

			get: function () {
				return store.api.query(function (resp) {
					angular.copy(resp.results, store.todos);
				});
			},

			insert: function (todo) {
				var originalTodos = store.todos.slice(0);

				return store.api.save(todo,
					function success(resp) {
						todo.objectId = resp.objectId;
						store.todos.push(todo);
					}, function error() {
						angular.copy(originalTodos, store.todos);
					})
					.$promise;
			},

			put: function (todo) {
				return store.api.update({ id: todo.objectId }, todo)
					.$promise;
			}
		};

		return store;
	})

	.factory('localStorage', function ($q) {
		'use strict';

		var STORAGE_ID = 'todos-angularjs';

		var store = {
			todos: [],

			_getFromLocalStorage: function () {
				return JSON.parse(localStorage.getItem(STORAGE_ID) || '[]');
			},

			_saveToLocalStorage: function (todos) {
				localStorage.setItem(STORAGE_ID, JSON.stringify(todos));
			},

			clearCompleted: function () {
				var deferred = $q.defer();

				var incompleteTodos = store.todos.filter(function (todo) {
					return !todo.completed;
				});

				angular.copy(incompleteTodos, store.todos);

				store._saveToLocalStorage(store.todos);
				deferred.resolve(store.todos);

				return deferred.promise;
			},

			delete: function (todo) {
				var deferred = $q.defer();

				store.todos.splice(store.todos.indexOf(todo), 1);

				store._saveToLocalStorage(store.todos);
				deferred.resolve(store.todos);

				return deferred.promise;
			},

			get: function () {
				var deferred = $q.defer();

				angular.copy(store._getFromLocalStorage(), store.todos);
				deferred.resolve(store.todos);

				return deferred.promise;
			},

			insert: function (todo) {
				var deferred = $q.defer();

				store.todos.push(todo);

				store._saveToLocalStorage(store.todos);
				deferred.resolve(store.todos);

				return deferred.promise;
			},

			put: function (todo, index) {
				var deferred = $q.defer();

				store.todos[index] = todo;

				store._saveToLocalStorage(store.todos);
				deferred.resolve(store.todos);

				return deferred.promise;
			}
		};

		return store;
	});
