angular.module("musicachieve").controller("BoxesCtrl", ['$scope', '$rootScope', '$meteor',
  function($scope, $rootScope, $meteor) {
    var audioContext = null;
    var isPlaying = false; // Are we currently playing?
    var startTime; // The start time of the entire sequence.
    var current16thNote; // What note is currently last scheduled?
    $scope.tempo = 100.0; // tempo (in beats per minute)
    var lookahead = 25.0; // How frequently to call scheduling function
    //(in milliseconds)
    var scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)
    // This is calculated from lookahead, and overlaps
    // with next interval (in case the timer is late)
    var nextNoteTime = 0.0; // when the next note is due.
    $scope.noteResolution = 2; // 0 == 16th, 1 == 8th, 2 == quarter note
    var noteLength = 0.01; // length of "beep" (in seconds)
    var timerID = 0; // setInterval identifier.

    var canvas, // the canvas element
      canvasContext; // canvasContext is the canvas' context 2D
    var last16thNoteDrawn = -1; // the last "box" we drew on the screen
    //0,4,8,12=1, 1,5,9,13=e, 2,6,10,14=&, 3,7,11,15=a
    $scope.pattern = [0, 1, 2, 3, 4, 6];
    $scope.percentageOfBeat = .25;
    $scope.metVolume = 5;
    $scope.buttonText = 'Play';
    $scope.range = function(count) {
      var numbers = [];

      for (var i = 0; i < count; i++) {
        numbers.push(i)
      }
      return numbers;
    };

    $scope.renderNotes = function () {
      var o = ($scope.pattern.indexOf(0) > -1) ? "C'" :'z';
      var o_e = ($scope.pattern.indexOf(1) > -1) ? "C'" :'z';
      var o_an = ($scope.pattern.indexOf(2) > -1) ? "C'" :'z';
      var o_a = ($scope.pattern.indexOf(3) > -1) ? "C'" :'z';
      var one = o+o_e+o_an+o_a;

      var t = ($scope.pattern.indexOf(4) > -1) ? "C'" :'z';
      var t_e = ($scope.pattern.indexOf(5) > -1) ? "C'" :'z';
      var t_an = ($scope.pattern.indexOf(6) > -1) ? "C'" :'z';
      var t_a = ($scope.pattern.indexOf(7) > -1) ? "C'" :'z';
      var two = t+t_e+t_an+t_a;

      var th = ($scope.pattern.indexOf(8) > -1) ? "C'" :'z';
      var th_e = ($scope.pattern.indexOf(9) > -1) ? "C'" :'z';
      var th_an = ($scope.pattern.indexOf(10) > -1) ? "C'" :'z';
      var th_a = ($scope.pattern.indexOf(11) > -1) ? "C'" :'z';
      var three = th+th_e+th_an+th_a;

      var f = ($scope.pattern.indexOf(12) > -1) ? "C'" :'z';
      var f_e = ($scope.pattern.indexOf(13) > -1) ? "C'" :'z';
      var f_an = ($scope.pattern.indexOf(14) > -1) ? "C'" :'z';
      var f_a = ($scope.pattern.indexOf(12) > -1) ? "C'" :'z';
      var four = f+f_e+f_an+f_a;

      function eighthRest(b) {
        var val = b.replace("zz", "z2");

        return val;
      }

      var beats = "X: \n L:1/16 \n M:none \n K: C clef=treble \n "+eighthRest(one)+" "+eighthRest(two)+" "+eighthRest(three)+" "+eighthRest(four)+"|";

      ABCJS.renderAbc('notation', beats, {}, {
        scale: 2
      });

    };
    $scope.renderNotes();

    $scope.toggleBeat = function(beat) {
      if ($scope.pattern.indexOf(beat) > -1) {
        var index = $scope.pattern.indexOf(beat);
        $scope.pattern.splice(index, 1);

      } else {
        $scope.pattern.push(beat);
      }
      $scope.renderNotes();
    };
    $scope.isActive = function(beat) {
      if ($scope.pattern.indexOf(beat) > -1) {
        return "btn-success";
      } else {
        return "btn-default";
      }
    };


    // $scope.measure = [{
    //   beat: 0,
    //   duration: 'q'
    // }, {
    //   beat: 1,
    //   duration: 'q'
    // }, {
    //   beat: 8,
    //   duration: 'h'
    //
    // }, {
    //   beat: 8,
    //   duration: 'h'
    // }];


    var notesInQueue = []; // the notes that have been put into the web audio,
    // and may or may not have played yet. {note, time}

    // First, let's shim the requestAnimationFrame API, with a setTimeout fallback
    window.requestAnimFrame = (function() {
      return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
    })();

    $scope.nextNote = function() {
      // Advance current note and time by a 16th note...
      // Notice this picks up the CURRENT
      // tempo value to calculate beat length.
      var secondsPerBeat = 60.0 / $scope.tempo;

      // Add 1/4 of quarter note beat length to the time
      nextNoteTime += $scope.percentageOfBeat * secondsPerBeat;

      current16thNote++; // Advance the beat number, wrap to zero
      if (current16thNote == 16) {
        current16thNote = 0;
      }
    }


    $scope.beatTap = function(comment) {
      $scope.comment = comment;

      console.log(current16thNote - 1);
      $scope.beat = current16thNote - 1;


    };
    $scope.getLength = function(duration) {
      switch (duration) {
        case "h":
          noteLength = 60 / ($scope.tempo / 2) - scheduleAheadTime;
          break;
        case "q":
          noteLength = 60 / $scope.tempo - scheduleAheadTime;
          break;
      }
      console.log("Duration: " + duration + ", Value = " + noteLength + " @ tempo: " + $scope.tempo);
      return noteLength;
    };


    $scope.scheduleNote = function(beatNumber, time, rhythm) {
      // push the note on the queue, even if we're not playing.
      notesInQueue.push({
        note: beatNumber,
        time: time
      });

      // if (($scope.noteResolution == 1) && (beatNumber % 2))
      //   return; // we're not playing non-8th 16th notes
      // if (($scope.noteResolution == 2) && (beatNumber % 4))
      //   return; // we're not playing non-quarter 8th notes


      // var osc = audioContext.createOscillator();
      // osc.connect(audioContext.destination);
      //
      // // Create a gain node.
      // var gainNode = audioContext.createGain();
      // // Connect the source to the gain node.
      // osc.connect(gainNode);
      // // Connect the gain node to the destination.
      // gainNode.connect(audioContext.destination);
      //
      //
      // gainNode.gain.value = $scope.metVolume;
      //
      // if (beatNumber % 16 === 0) // beat 0 == low pitch
      //   osc.frequency.value = 880.0;
      // else if (beatNumber % 4 === 0) // quarter notes = medium pitch
      //   osc.frequency.value = 440.0;
      // else // other 16th notes = high pitch
      //   osc.frequency.value = 440.0;
      //
      // osc.start(time);
      // osc.stop(time + noteLength);
      // for (var i = 0; i < rhythm.length; i++) {
      //
      //   if (rhythm[i].beat === beatNumber) {
      //     // create an oscillator
      //     var osc2 = audioContext.createOscillator();
      //
      //     osc2.connect(audioContext.destination);
      //     osc2.frequency.value = 220.0;
      //
      //     $scope.beatValue = $scope.getLength(rhythm[i].duration);
      //
      //     osc2.start(time);
      //     osc2.stop(time + noteLength);
      //   }
      // }
      if (rhythm.indexOf(beatNumber) == -1)
        return; // this note is not in the pattern.
      // create an oscillator
      var osc2 = audioContext.createOscillator();
      // Create a gain node.
      var gainNode = audioContext.createGain();
      // Connect the source to the gain node.
      osc2.connect(gainNode);
      // Connect the gain node to the destination.
      gainNode.connect(audioContext.destination);


      gainNode.gain.value = $scope.metVolume;


      osc2.connect(audioContext.destination);
      if (beatNumber % 16 === 0) // beat 0 == low pitch
        osc2.frequency.value = 300.0;
      else if (beatNumber % 4 === 0) // quarter notes = medium pitch
        osc2.frequency.value = 440.0;
      else // other 16th notes = high pitch
        osc2.frequency.value = 600.0;

      // $scope.beatValue = $scope.getLength(rhythm[i].duration);

      osc2.start(time);
      osc2.stop(time + noteLength);


    };

    $scope.scheduler = function() {
      // while there are notes that will need to play before the next interval,
      // schedule them and advance the pointer.
      while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
        $scope.scheduleNote(current16thNote, nextNoteTime, $scope.pattern);
        $scope.nextNote();
      }
      timerID = window.setTimeout($scope.scheduler, lookahead);
    };

    $scope.play = function() {
      isPlaying = !isPlaying;

      if (isPlaying) { // start playing
        current16thNote = 0;
        nextNoteTime = audioContext.currentTime;
        $scope.scheduler(); // kick off scheduling
        $scope.buttonText = "Stop";
      } else {
        window.clearTimeout(timerID);
        $scope.buttonText = "Play";
      }
    };

    $scope.resetCanvas = function(e) {
      // resize the canvas - but remember - this clears the canvas too.
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      //make sure we scroll to the top left.
      window.scrollTo(0, 0);
    };



    $scope.draw = function() {
      var currentNote = last16thNoteDrawn;
      var currentTime = audioContext.currentTime;

      while (notesInQueue.length && notesInQueue[0].time < currentTime) {
        currentNote = notesInQueue[0].note;
        notesInQueue.splice(0, 1); // remove note from queue
      }

      // We only need to draw if the note has moved.
      if (last16thNoteDrawn != currentNote) {
        var x = Math.floor(canvas.width / 18);
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < 16; i++) {
          canvasContext.fillStyle = (currentNote == i) ?
            ((currentNote % 4 === 0) ? "green" : "blue") : "black";
          canvasContext.fillRect(x * (i + 1), x, x / 2, x / 2);

        }
        last16thNoteDrawn = currentNote;
      }

      // set up to draw again
      requestAnimFrame($scope.draw);
    };

    $scope.init = function() {
      var container = document.createElement('div');

      container.className = "container";
      canvas = document.createElement('canvas');
      canvasContext = canvas.getContext('2d');
      canvas.width = "400";
      canvas.height = "400";
      document.body.appendChild(container);
      container.appendChild(canvas);
      canvasContext.strokeStyle = "#ffffff";
      canvasContext.lineWidth = 2;

      // NOTE: THIS RELIES ON THE MONKEYPATCH LIBRARY BEING LOADED FROM
      // Http://cwilso.github.io/AudioContext-MonkeyPatch/AudioContextMonkeyPatch.js
      // TO WORK ON CURRENT CHROME!!  But this means our code can be properly
      // spec-compliant, and work on Chrome, Safari and Firefox.

      audioContext = new AudioContext();

      // if we wanted to load audio files, etc., this is where we should do it.

      window.onorientationchange = $scope.resetCanvas;
      window.onresize = $scope.resetCanvas;

      requestAnimFrame($scope.draw); // start the drawing loop.

    };


    window.addEventListener("load", $scope.init());

  }
]);
