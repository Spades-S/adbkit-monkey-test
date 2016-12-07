# adbkit-monkey

> @brief 利用adbkit-monkey实现功能：网页上操控Android设备完成相应动作
>
> @author Spades

`使用的工具、开源框架:`

[jquery](https://jquery.com/)  、[adbkit-monkey](https://github.com/openstf/adbkit-monkey) 、[socket.io](http://socket.io/)

`实现逻辑`

````javascript
触发鼠标事件 -> 捕捉鼠标位置 -> 前后端通信(传递的信息（message）为鼠标位置) -> 服务器得到鼠标位置信息，将其转化为Android屏幕上对应位置 -> adbkit-monkey实现操控
````



##### adbkit-monkey

`adbkit-monkey` 主要实现的是将指令传递给monkey，`monkey`是Android自动化测试脚本 ，在调用`adbkit-monkey`之前，必须先确定monkey已经处在运行状态

```` shell
adb shell monkey --port 1080  //monkey开启专用端口
adb forward tcp: 5050 tcp: 1080 //本地端口转发，连接本地5050端口即可实现和Android设备中monkey通信
````

> *可能出现的问题*

````shell
如果出现 Error bing to network socket错误，可能是因为monkey进程正在运行
可以尝试下述操作：
adb shell ps | grep monkey //查找monkey进程号，返回的第一个数字即为monkey 进程号
adb shell kill + monkeyPid //杀死monkey进程
````

> *具体使用*

````shell
//installation
npm install --save adbkit-monkey
// if you are in China, you can use
cnpm install --save adbkit-monkey
````

````javascript
var monkey = require('adbkit-monkey');//引用adbkit-monkey
var client = monkey.connect({port : PORT});//连接本地端口
//其他具体的操作可以看monkey的api
//其他的操作均是异步操作
````

````javascript
如果想要操作多次Android设备，调用完adbkit-monkey相应的函数(touchDown()等)，不可调用client.end()方法，否则再次调用monkey.connect()方法时，monkey会自动退出
/****************出现该现象的具体原因暂时不清楚（2016.12.6）**********************/
解决问题的方法是，调用monkey.connect()方法调用对应的操作函数后，不调用client.end()，即不断开连接，此时可以进行多次操作。
````



##### 捕捉鼠标动作

`鼠标动作和触屏动作的对应`

```
整个工作的目的是实现在网页上操控Android设备完成相应的动作。实际操控的是鼠标，为了实现在Android设备上显示操作效果，直观上需要对鼠标动作和触摸动作做一个对应。
将鼠标的点击动作分解为mousedown和mouseup，分别对应Android设备的touchdown和touchup，鼠标的move动作对应Android设备的touchmove动作。
```

````javascript
触摸逻辑：touchdown是touchmove和touchup动作的前提
touchdown{
  touchmove；
  touchup；
}
````

```javascript
//鼠标动作的触发函数
function touchDown(){//鼠标移动触发函数
  element.bind(touchMove);
  element.bind(touchUp);
}
element.bind(touchDown);
function touchMove(){} //鼠标移动触发函数
function touchUp(){}//鼠标弹起触发函数
```



##### 前后端通信

> 在此只针对项目(网页操作Android设备实现触摸效果)做简单总结

`socket.io`

```
为什么需要进行前后端通信？
鼠标的动作是在前端进行捕捉的，发送Android设备触摸命令是在后端进行的，鼠标动作和Android触摸动作的映射也是在后端完成的。基于上述情况，我们需要进行前后端通信，
```

```html
<!--前端html关键代码-->
<script src = "http://localhost:3030/socket.io/socket.io.js"></script> 
<!--socket.io文件是动态生成的,需要引用到具体的服务器ip+端口-->
```

```javascript
//前段JavaScript关键代码
var socket = io('http://localhost:3030');//创建socket
socket.on();//接收
socket.emit();//发送
```

```javascript
//后端代码
var io = require('socket.io').listen( 3030 ); //
io.sockets.on('conncetion', function(socket){
  
})
```













