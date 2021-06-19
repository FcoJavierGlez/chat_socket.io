const socket = io();

document.addEventListener("DOMContentLoaded", () => {
    const MESSAGE     = document.getElementById("message");
    const USERNAME    = document.getElementById("username");
    //const BUTTON_SEND = document.getElementById("send");
    const OUTPUT      = document.getElementById("output");
    const ACTIONS     = document.getElementById("actions");

    const capitalize = string => string.replace(/^\w/, e => e.toUpperCase() );

    const getRecipient = message => {
        let conjunto = [...message.matchAll(/\@(\w+)/g)];
        let recipient = '';
        conjunto.forEach( (e,i) => {
            recipient += conjunto.length - 1 == i ? e[1] : `${e[1]}, `;
        });
        return recipient;
    }

    socket.on('chat:message', (data) => {   //Actualización del chat
        console.log(data);
        if ( data.to !== '' && ( data.from == USERNAME.value || data.to.match( USERNAME.value.toLowerCase() ) ) )
            OUTPUT.innerHTML += `
                <p class='careless-whisper'}'>
                    <b>${data.time} ${data.from !== USERNAME.value ? 'From' : 'To'} ${data.from !== USERNAME.value ? "@"+data.from : capitalize(data.to.replace( /\b(\w)\,?/g, e => "@"+capitalize(e) ) )}:</b> ${data.message}
                </p>`;
        else if (data.to == '')
            OUTPUT.innerHTML += `
                <p>
                    <b>${data.time} ${data.from}:</b> ${data.message}
                </p>`;
            
        OUTPUT.scroll(0, OUTPUT.clientHeight );
    });
    socket.on('chat:typing', (data) => {    //Mensaje de quién está escribiendo
        if (data.from == USERNAME.value) return;
        ACTIONS.innerHTML = data.message == '' ? '' : `<small>${data.from} is writting now</small>`;
    });
    socket.on('chat:users', data => {
        console.log(data);
    });
    MESSAGE.addEventListener("keydown", (ev) => {
        if (ev.key == 'Enter' || ev.key == 'NumpadEnter') {
            ev.preventDefault();
            if (MESSAGE.value == '' || USERNAME.value == '') return;
            let recipient = getRecipient( MESSAGE.value );
            let message = { from: USERNAME.value, to: recipient, message: recipient == '' ? MESSAGE.value : MESSAGE.value.match(/\@\w+\s(.+)/)?.[1] };
            socket.emit( 'chat:message', message );
            socket.emit( 'chat:typing', { from: USERNAME.value, message: '' } );
            MESSAGE.value = "";
        } else {
            if (USERNAME.value == '') return;
            socket.emit( 'chat:typing', { from: USERNAME.value, message: MESSAGE.value } );
        }
    });
});