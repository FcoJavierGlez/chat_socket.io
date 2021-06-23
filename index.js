const formatDate = require('./functions');

let usersList = [];

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
    console.log('new connetion', socket.id);
    //console.log('Client', socket.client);

    usersList.push( {id: socket.id, name: '' } );
    io.sockets.emit( 'chat:users', usersList.map( e => e.name ) );

    socket.on('chat:username-select', data => { //select username
        let user = {};
        if ( usersList.find( e => e.name == data ) !== undefined) 
            return socket.emit('chat:validate-username', false);
        usersList.find( e => e.id == socket.id ).name = data;
        user = usersList.find( e => e.id == socket.id )
        //console.log( user );
        console.log('users list:', usersList);
        socket.emit('chat:validate-username', true);
        socket.broadcast.emit('chat:message', { alert:true, message: `${user.name} connected` });
        io.sockets.emit('chat:users-list', usersList);
    });

    socket.on('disconnect', function() {    //disconnect
        console.log('Got disconnect!', socket.id);
        let userName = usersList.find( e => e.id == socket.id )['name'];
        usersList = usersList.filter( e => e.id !== socket.id );
        io.sockets.emit( 'chat:users', usersList.map( e => e.name ) );
        socket.broadcast.emit('chat:message', { alert:true, message: `${userName} disconnected` });
        io.sockets.emit('chat:users-list', usersList);
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
