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
    armed = false;
    flying = true;
    console.log('takeoff');
    // copter takeoff
    drone.takeoff();
  }
}

var land = function(){
  flying = false;
  console.log('\nLanding!\n');
  drone.land();
  // land the copter
  // wait for some time before allowing re-arm
}

var maxPitch = 0.5;
var pitchBuffer = 0.15;

var maxRoll = 0.5;
var rollBuffer = 0.15;

var maxYaw = 0.5;
var yawBuffer = 0.15;

var move = function(pitch, roll, yaw, thrust){
  //console.log('pitch: ' + pitch + 'roll: ' + roll + ' yaw: ' + yaw + ' thrust: ' + thrust);
  if ((pitch < pitchBuffer) && (pitch > -pitchBuffer)) pitch = 0;
  if ((roll < rollBuffer) && (roll > -rollBuffer)) roll = 0;
  if ((yaw < yawBuffer) && (yaw > -yawBuffer)) yaw = 0;

  if (pitch < 0){
    var pitchValue = Math.pow(40,(-pitch-1));
    var pitchFront = pitchValue > maxPitch ? maxPitch : pitchValue;
    console.log('forward ', pitchFront);
    drone.front(pitchFront)
  }
  if (pitch > 0){
    var pitchValue = Math.pow(40,(pitch-1));
    var pitchBack = pitchValue > maxPitch ? maxPitch : pitchValue;
    console.log('back ', pitchBack);
    drone.back(pitchBack);
  }

  if (roll < 0){
    var rollValue = Math.pow(40,(-roll-1));
    var rollRight = rollValue > maxRoll ? maxRoll : rollValue;
    console.log('right', rollRight);
    drone.right(rollRight);
  }
  if (roll > 0){
    var rollValue = Math.pow(40,(roll-1));
    var rollLeft = rollValue > maxRoll ? maxRoll : rollValue;
    console.log('left', rollLeft);
    drone.left(rollLeft);
  }

  if (yaw < 0){
    var yawValue = (Math.pow(40,(-yaw-1)));
    var yawLeft = yawValue > maxYaw ? maxYaw : yawValue;
    console.log('yawLeft', yawLeft);
    drone.counterClockwise(yawLeft);
  }
  if (yaw > 0){
    var yawValue = Math.abs(Math.pow(40,(yaw-1)));
    var yawRight = yawValue > maxYaw ? maxYaw : yawValue;
    console.log('yawRight', yawRight);
    drone.clockwise(yawRight);
  }
  if (thrust > 200){
    console.log('going up');
    drone.up(0.5); 
  } else if (thrust < 100) {
    console.log('going down');
    drone.down(0.5);
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
      var pitch = handsArr[0].pitch();
      var roll = handsArr[0].roll();
      var yaw = 0;
      var thrust = handsArr[0].palmPosition[1];
      move(pitch, roll, yaw, thrust);
  }

  // double hand control
  if ((handsArr.length == 2) && flying && (handsArr[0].fingers.length >= 4) && (handsArr[1].fingers.length >= 4)){
      var pitch = handsArr[0].pitch();
      var roll = handsArr[0].roll();
      var yaw = handsArr[1].yaw();
      var thrust = handsArr[1].palmPosition[1];
      move(pitch, roll, yaw, thrust);
  }
}

controller.on('frame', function(newFrame){
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
