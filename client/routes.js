angular.module("musicachieve").run(["$rootScope", "$state", function($rootScope, $state) {
  $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
    // We can catch the error thrown when the $requireUser promise is rejected
    // and redirect the user back to the main page
    if (error === "AUTH_REQUIRED") {
      $state.go('parties');
    }
  });
}]);

angular.module("musicachieve").config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
  function($urlRouterProvider, $stateProvider, $locationProvider) {

    $locationProvider.html5Mode(true);

    $stateProvider
      .state("boxes", {
        url:'/boxes',
        templateUrl:'client/lists/views/boxes.ng.html',
        controller:'BoxesCtrl',
        resolve:{
          "currentUser": ["$meteor", function ($meteor) {
            return $meteor.requireUser();
          }]
        }
      });


    $urlRouterProvider.otherwise("/boxes");
  }
]);
