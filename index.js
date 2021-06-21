//import { functions } from './functions';

const formatDate = date => date < 10 ? `0${date}` : date;

const path = require('path');
const express = require('express');
const app = express();

const socketIo = require('socket.io');

//Settings
app.set( 'port', process.env.PORT || 3000 ); //process.env.PORT Toma el puesto configurado por defecto en el SO

//statics file
app.use( express.static( path.join(__dirname,'public') ) );

//Start server
const server = app.listen( app.get('port'), () => {
    console.log('Server on port: ', app.get('port'));
});

//Websockets
const io = socketIo( server );
io.on('connection', (socket) => {
    //const USERS = [];
    console.log('new connetion', socket.id);
    //console.log('Client', socket.client);
    //io.sockets.emit('chat:users', socket.id);
    socket.on('disconnect', function() {
        console.log('Got disconnect!', socket.id);
    });
    socket.on('chat:message', data => {
        const date = new Date();
        data.time = `${formatDate( date.getHours() )}:${formatDate( date.getMinutes() )}:${formatDate( date.getSeconds() )}`;
        io.sockets.emit('chat:message', data);
    });
    socket.on('chat:typing', data => {
        socket.broadcast.emit('chat:typing', data);
    });
});
