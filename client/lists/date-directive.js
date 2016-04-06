angular.module("musicachieve")
.directive('dateformat', function() {
    return {
        restrict: 'A',
        transclude: true,
        scope: {
            date: '@'
        },
        link: function(scope, el, attr) {
            
            deadline = new Date(scope.date);
            // scope.dateform = moment("2015-08-14T05:00:00.000Z").format("ddd, MMM Do");
            scope.dateform = moment(deadline).format("ddd, MMM D");
            // scope.dateform = scope.date.toString();
        },
        template: "{{dateform}}"
    };
});
