  var socket = io('http://localhost:3030');

  var div = document.getElementById('div')

  var screen = {
    bounds: {
        x: 0,
        y: 0,
        w: 0,
        h: 0
    }
}

function calculateBounds(element){
    screen.bounds.w = element.offsetWidth;
    screen.bounds.h = element.offsetHeight;
   
    screen.bounds.x = 0;
    screen.bounds.y = 0;

    while(element.offsetParent){
        screen.bounds.x += element.offsetLeft;
        screen.bounds.y += element.offsetLeft;
        element = element.offsetParent; 
    }
    
    // console.log('x' + screen.bounds.x + ' y' + screen.bounds.y);
    // console.log('w' + screen.bounds.w + '   h' + screen.bounds.h);


}


function mouseDownListener(event){
    if(event.which == 3){                      //点击右键，return
        return
    }
    
    event.preventDefault();     
    calculateBounds(div); 
    var x = event.pageX - screen.bounds.x;
    var y = event.pageY - screen.bounds.y;
    var pressure = 0.5;
    var scaled = {
       w: screen.bounds.w,
       h: screen.bounds.h,
       x: x,
       y: y
    }    

    socket.emit('mousedown', scaled);
    $('#div').bind('mousemove', mouseMoveListener);
    $(document).bind('mouseup', mouseUpListener);
    $(document).bind('mouseleave', mouseUpListener);
    


}

function mouseMoveListener(event){
    if(event.which == 3){                      //点击右键，return
        return
    }
    
    event.preventDefault();     
    calculateBounds(div); 
    var x = event.pageX - screen.bounds.x;
    var y = event.pageY - screen.bounds.y;
    var pressure = 0.5;
    var scaled = {
       w: screen.bounds.w,
       h: screen.bounds.h,
       x: x,
       y: y
    }    
    socket.emit('mousemove', scaled);

}

function mouseUpListener(event){
    if(event.which == 3){                      //点击右键，return
        return
    }
    
    event.preventDefault();     
    calculateBounds(div); 
    var x = event.pageX - screen.bounds.x;
    var y = event.pageY - screen.bounds.y;
    var pressure = 0.5;
    var scaled = {
       w: screen.bounds.w,
       h: screen.bounds.h,
       x: x,
       y: y
    }    
    socket.emit('mouseup', scaled);
    stopMousing();

}

function stopMousing(){
    $('#div').unbind('mousemove', mouseMoveListener);
    $(document).unbind('mouseup', mouseUpListener);
    $(document).unbind('mouseleave', mouseUpListener);    
}

div.addEventListener('mousedown', mouseDownListener);
