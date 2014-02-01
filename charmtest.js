var charm = require('charm')();
charm.pipe(process.stdout);
charm.reset();
var num = 0;
console.log("line one!\n");
var writeString = 'test';
var iv = setInterval(function () {
    charm.erase('line').left(writeString.length).write(writeString);
    num++;
}, 100);
