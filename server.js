var io = require('socket.io').listen( 3030 );

var assert = require('assert');
var monkey = require('adbkit-monkey');
var PORT = 5050;
var client = monkey.connect({port: PORT});
var deviceScreenWidth, deviceScreenHeight;
io.sockets.on('connection', function(socket){

    client.getDisplayWidth(function(err, width) { //异步调用
        assert.ifError(err);
        deviceScreenWidth = width;
        client.getDisplayHeight(function(err, height) {
            assert.ifError(err);
            deviceScreenHeight = height;
            console.log('Display size is %dx%d', width, height);

            
            client.wake(function(err){
                console.log(err);
            });



            socket.on('mousedown', function(data){  //client 发送click时触发
                console.log('down');
                console.log(data);
                
                 websizeToDevicesize(data, deviceScreenWidth, deviceScreenHeight);
                 client.touchDown(data.x, data.y, function(err){
                     console.log('error:' + err);
                 });
            });

            socket.on('mousemove', function(data){
                console.log('move');
                console.log(data);
                websizeToDevicesize(data, deviceScreenWidth, deviceScreenHeight);
                client.touchMove(data.x, data.y, function(err){
                     console.log('error:' + err);
                 });
            })


            socket.on('mouseup', function(data){
                console.log('up');
                console.log(data);
                websizeToDevicesize(data, deviceScreenWidth, deviceScreenHeight);
                client.touchUp(data.x, data.y, function(err){
                     console.log('error:' + err);
                 });
            })
                });
            });



})

function websizeToDevicesize(data, deviceWidth, deviceHeight){
    data.x = Math.floor((data.x/data.w)*deviceWidth);
    data.y = Math.floor((data.y/data.h)*deviceHeight);
   

}