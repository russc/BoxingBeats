angular.module("musicachieve")
  .directive('convertid', function() {
    return {
      restrict: 'A',
      transclude: true,
      scope: {
        convert: '='
      },
      link: function(scope, el, attr) {
        var id = scope.convert;

        var user = Meteor.users.find({
          _id: id
        }, {
          fields: {
            profile: 1
          }
        });
        user.forEach(function(myDoc) {
          scope.conversion = myDoc.profile.name;

        });
      // scope.conversion = scope.convert;

      },
      template: "{{conversion}}"
    };
  });
