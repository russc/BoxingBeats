angular.module("musicachieve").controller("BeatsCtrl", ['$scope', '$rootScope', '$meteor',
  function($scope, $rootScope, $meteor) {
    var context = new AudioContext();
    var LOOP_LENGTH = 16.0;
    var note;
    var start;
    var rhythmIndex = 0;
    var tempo = 60;
    $scope.beat = rhythmIndex;
    $scope.playNote = function (time) {
      var source = context.createOscillator();
      source.connect(context.destination);
      source.frequency.value = 440.0;
      source.start(time);
      source.stop(time + .05);
    };


    $scope.play = function (event) {
      note = 0.0;
      //slight delay before playing.  This will need to have a count in feature.
      start = context.currentTime +0.005;
      rhythmIndex = 0;
      $scope.schedule();
    };

    $scope.stop = function (event) {
      clearTimeout(timeoutId);
    };


    $scope.schedule = function () {
      var currentTime = context.currentTime;

      //The sequence starts at start function.  This normalizes currentTime to 0.
      currentTime -= start;

      while(note < currentTime + 0.200){
        var contextPlayTime = note +start;

        $scope.playNote(contextPlayTime);

        $scope.advanceNote();
      }
      timeoutId = window.setTimeout($scope.schedule(), 0.0);

    }

    $scope.advanceNote = function () {
      //set initial tempo
      console.log('note advanced');
      var tempo = 60.0;
      var secondsPerBeat = 60.0 / tempo;

      rhythmIndex++;
      if(rhythmIndex == LOOP_LENGTH){
        rhythmIndex = 0;
      }

      //0.25 because each square is a 16th note.
      note += 0.25 * secondsPerBeat;
    }
  }
]);
