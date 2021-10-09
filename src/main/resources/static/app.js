var app = (function () {

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }
    
    var stompClient = null;
    var idDrawing = null;
    var input = document.querySelector('#idDrawing');

    var loadEventListener = function(){
        if( input ) input.addEventListener('change', updateId);
        const eventCanvas = (window.PointerEvent)?'pointerdown':'mousedown';
        canvas.addEventListener(eventCanvas, eventPoint);
    }
    
    var updateId = function(event){
        idDrawing = event.target.value;
        console.log(`nuevoValor ${idDrawing}`);
    }

    var eventPoint = function (event){
        const pt = getMousePosition(event);
        /* addPointToCanvas(pt); Esto funciona porque me suscribi a los eventos*///
        addPointToCanvas(pt);
        //publicar el evento
        if(idDrawing) stompClient.send(`/topic/newpoint.${idDrawing}`, {}, JSON.stringify(pt));
    }

    var addPointToCanvas = function (point) {        
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };
    
    
    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };


    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        
        //subscribe to /topic/TOPICXX when connections succeed, esto es para escuchar un evento cuando llega un nuevo mensaje desde el servidor
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            canvas.width = canvas.width;
            stompClient.subscribe(`/topic/newpoint.${idDrawing}`, function (eventbody) {
                /* var { x, y } = JSON.parse(eventbody.body);
                alert(`Coordenada en x: ${x}, coordenada en y: ${y}`); */

                const object = JSON.parse(eventbody.body);
                addPointToCanvas(object);
            });
        });
    };    
    
    return {

        init: function () {
            loadEventListener();
        },

        publishPoint: function(px,py){
            var pt=new Point(px,py);
            console.info("publishing point at "+pt);
            addPointToCanvas(pt);
            //publicar el evento, enviar puntos al broker (servidor Spring) y mostrara el cambio a los demans clientes
            /* stompClient.publish({
                destination:'/app/newpoint',
                body: JSON.stringify(pt) --> ESTE ES OPCIONAL
            }) */
            stompClient.send(`/topic/newpoint.${idDrawing}`, {}, JSON.stringify(pt));
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        },
        publishDrawing( currentId ){
            idDrawing = currentId;
            //websocket connection
            connectAndSubscribe();
        }
    };

})();