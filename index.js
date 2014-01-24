var Leap = require('leapjs');
var drone = require('ar-drone').createClient();
var controller = new Leap.Controller({enableGestures:true});
var figlet = require('node-figlet');

var armed = false,
    flying = false,
    armWait = 5000,
    armCount = 0,
    gesturelifetime = 3,
    activeGestures = {},
    frame;

drone.disableEmergency();
var arm = function(){
  armed = true;
}

var takeoff = function(){
  if (armed && !flying){
    flying = true;
    console.log('takeoff');
    // copter takeoff
    drone.takeoff();
  }
}

var land = function(){
  flying = false;
  armed = false;
  console.log('\nLanding!\n');
  drone.land();
  // land the copter
  // wait for some time before allowing re-arm
}

var scaleMove = 5;
var move = function(pitch, roll, yaw, thrust){
  console.log('pitch: ' + pitch + 'roll: ' + roll + ' yaw: ' + yaw + ' thrust: ' + thrust);
  if (pitch < 0){
    var pitchFront = Math.abs(pitch/scaleMove);
    console.log('forward ', pitchFront);
    drone.front(pitchFront)
  }
  if (pitch > 0){
    var pitchBack = Math.abs(pitch/scaleMove);
    console.log('back ', pitchBack);
    drone.back(pitchBack);
  }

  if (roll < 0){
    var pitchRight = Math.abs(roll/scaleMove);
    console.log('right', pitchRight);
    drone.right(pitchRight);
  }
  if (roll > 0){
    var pitchLeft = Math.abs(roll/scaleMove);
    console.log('left', pitchLeft);
    drone.left(pitchLeft);
  }

  if (yaw < 0){
    var yawLeft = Math.abs(yaw/10);
    console.log('yawLeft', yawLeft);
    drone.counterClockwise(yawLeft);
  }
  if (yaw > 0){
    var yawRight = Math.abs(yaw/10);
    console.log('yawRight', yawRight);
    drone.clockwise(yawRight);
  }
}

var updateGestures = function(){
  for (var prop in activeGestures) {
    if (activeGestures.hasOwnProperty(prop)){
      var gesture = activeGestures[prop];
      var age = frame.timestamp - gesture.time;
      age /= 1000000;

      if (age >= gesturelifetime){
        console.log('clear', gesture.type);
        activeGestures[gesture.type] = null;
        delete activeGestures[gesture.type];
      }
    }
  }
}

var onCircle = function( gesture ){
  if (!activeGestures[gesture.type] || activeGestures[gesture.type] == null){
    gesture['time'] = frame.timestamp;
    console.log(gesture.type, gesture.radius);
    activeGestures[gesture.type] = gesture;
  }
}

var onSwipe = function( gesture ){
  if (!activeGestures[gesture.type] || activeGestures[gesture.type] == null){
    gesture['time'] = frame.timestamp;
    console.log(gesture.type);
    activeGestures[gesture.type] = gesture;
  }
}

var onScreenTap = function( gesture ){
  if (!activeGestures[gesture.type] || activeGestures[gesture.type] == null){
    gesture['time'] = frame.timestamp;
    console.log(gesture.type);
    activeGestures[gesture.type] = gesture;
  }
}

var onKeyTap = function( gesture ){
  if (!activeGestures[gesture.type] || activeGestures[gesture.type] == null){
    gesture['time'] = frame.timestamp;
    console.log(gesture.type);
    activeGestures[gesture.type] = gesture;
    if (flying){
      land();
    } else {
      takeoff();
    }
  }
}

var dealWithHands = function(handsArr){
  if ((handsArr.length == 2) && !flying && !armed && activeGestures.circle){
    console.log('ARMING');
    armed = true; 
  }

  // if you're holding a closed fist when flying, stop the drone.
  if ((handsArr.length == 1) && flying && handsArr[0].fingers.length < 4){
    drone.stop();
    return;
  }
  // require ONE hand only, and four fingers when the drone is flying in 
  // order to give it commands
  if ((handsArr.length == 1) && flying && handsArr[0].fingers.length >= 4){
    for (var i = 0; i<handsArr.length; i++){
      //console.log(handsArr[0].palmPosition);
      // pitch, roll, yaw, thrust
      var pitch = handsArr[0].pitch() / 2;
      var roll = handsArr[0].roll() / 2;
      var yaw = handsArr[0].yaw() / 2;
      var thrust = handsArr[0].palmPosition[1];
      move(pitch, roll, yaw, thrust);
    }
  }
}

controller.on('frame', function(newFrame){
  //console.log(frame);
  frame = newFrame;
  for (var i = 0; i < frame.gestures.length; i++){
    var gesture = frame.gestures[i]; 
    
    // copter takeoff
    switch(gesture.type){
      case "circle":
        onCircle( gesture );
        break;
      case "swipe":
        onSwipe( gesture );
        break;
      case "screenTap":
        onScreenTap( gesture );
        break;
      case "keyTap":
        onKeyTap( gesture );
        break;
    }
  }
  dealWithHands(frame.hands);
  updateGestures();

});

controller.on('ready', function(){
  console.log('\nReady to fly!\n');
  console.log(' /-----\\\           /-----\\\  ');
  console.log(' |   / |           |   / |  ');
  console.log(' |  *  |           |  *  |  ');
  console.log(' | /   |           | /   |  ');
  console.log(' \\\_____/\           \\\_____/  ');
  console.log('      \\\\           //         ');
  console.log('        \\\\       //     ');
  console.log('          |-----|       ');
  console.log('          |     |         ');
  console.log('          |     |         ');
  console.log('          |-----|         ');
  console.log('        //       \\\\      ');
  console.log('      //           \\\\    ');
  console.log(' /-----\\\           /-----\\\  ');
  console.log(' |   / |           |   / |  ');
  console.log(' |  *  |           |  *  |  ');
  console.log(' | /   |           | /   |  ');
  console.log(' \\\_____/           \\\_____/  ');
});

controller.on('connect', function(){
  console.log('\nConnected to socket server. Waiting for device...');
});

controller.on('disconnect', function(){
  console.log('Disconnected from socket server.');
});

controller.on('deviceConnected', function(){
  console.log('Device connected.');
});

controller.on('deviceDisconnected', function(){
  console.log('Device disconnected.');
});

controller.connect();
figlet("Leapdrone!!", ["-c"], function(ascii){
  console.log('\n');
  console.log(ascii.toString());
  console.log('\nStarting Leapdrone...');
})
