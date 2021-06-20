const socket = io();
{
    const capitalize = string => string.replace(/^\w/, e => e.toUpperCase() );

    const getRecipient = message => {
        let conjunto = [...message.matchAll(/\@(\w+)/g)];
        let recipient = '';
        conjunto.forEach( (e,i) => {
            recipient += conjunto.length - 1 == i ? e[1] : `${e[1]}, `;
        });
        return recipient;
    }

    const rollDices = command => {
        let match      = command.match(/^\/([1-9]|1[0-9]|20)?d(2|4|6|8|10|12|20|30|100)((\+|\-)(\d{1,}))?(\*(2|3|4|5|6|7|8|9|10|11|12))?$/);
        let variacion  = match[3] === undefined ? 0 : (match[4] === "-" ? (match[5] * -1) : parseInt(match[5]));
        let numDados   = match[1] === undefined ? 1 : match[1];
        let numTiradas = match[7] === undefined ? 1 : match[7];
        let tipoDado   = match[2];
        let resultados = [];
        
        for (let i = 1; i <= numTiradas; i++) {
            let tiradas = [];
            for (let j = 1; j <= numDados; j++) 
                tiradas.push( parseInt(Math.random() * tipoDado + 1) );
            resultados.push( `<br/>&emsp;&emsp;&emsp;&emsp;(${tiradas.toString().replace(/,/g,"+")})${match[3] === undefined ? "" : match[3]}: <b>${tiradas.reduce( (acc,n) => acc + n) + variacion}</b>` );
        }
        return `<b>Tirada${numTiradas > 1 ? 's' : ''}:</b><br/> ${ resultados.reduce( (e,text) => text += e ) }`;
    }

    const executeCommand = input => {
        let command = '';
        switch (input) {
            case ( command = input.match(/^\/([1-9]|1[0-9]|20)?d(2|4|6|8|10|12|20|30|100)((\+|\-)(\d{1,}))?(\*(2|3|4|5|6|7|8|9|10|11|12))?$/)?.input ):
                return rollDices(input);
            default:
                return input;
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        const MESSAGE     = document.getElementById("message");
        const USERNAME    = document.getElementById("username");
        const BUTTON_SEND = document.getElementById("send");
        const BUTTON_ICON = document.getElementById("icons-button");
        const ICON_LIST   = document.getElementById("icon-list");
        const OUTPUT      = document.getElementById("output");
        const ACTIONS     = document.getElementById("actions");
    
        $("#icon-list").disMojiPicker();
        twemoji.parse(document.body);


        const sendMessage = ev => {
            ev.preventDefault();
            if (MESSAGE.value == '' || USERNAME.value == '') return;
            let recipient = getRecipient( MESSAGE.value );
            let message = { 
                from: USERNAME.value, 
                to: recipient, 
                message: recipient == '' ? 
                    executeCommand( MESSAGE.value ) : 
                    executeCommand( MESSAGE.value.replace(/\s?\,\s?(\w)/, ' $1').match(/\@\w+\s([^\,].+)$/)?.[1] )
            };
            /* let message = { 
                from: USERNAME.value, 
                to: recipient, 
                message: recipient == '' ? MESSAGE.value : MESSAGE.value.replace(/\s?\,\s?(\w)/, ' $1').match(/\@\w+\s([^\,].+)$/)?.[1]
            }; */
            console.log(message);
            socket.emit( 'chat:message', message );
            socket.emit( 'chat:typing', { from: USERNAME.value, message: '' } );
            MESSAGE.value = "";
            ICON_LIST.className = 'hidden';
            OUTPUT.removeAttribute('style');
        }
    
        socket.on('chat:message', (data) => {   //Actualización del chat
            //console.log(data);
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
    
        //Send message
        BUTTON_SEND.addEventListener("click", sendMessage);
        MESSAGE.addEventListener("keydown", (ev) => {
            if (ev.key == 'Enter' || ev.key == 'NumpadEnter') 
                sendMessage(ev);
            else {
                if (USERNAME.value == '') return;
                if ( /^\@/.test(MESSAGE.value) || (ev.code == 'Backspace' || ev.code == 'Delete' && MESSAGE.value == '') ) 
                    socket.emit( 'chat:typing', { from: USERNAME.value, message: '' } );
                else
                    socket.emit( 'chat:typing', { from: USERNAME.value, message: MESSAGE.value } );
            }
        });

        //Add icon into message
        BUTTON_ICON.addEventListener("click", () => {
            ICON_LIST.classList.toggle('hidden');
            ICON_LIST.className == 'hidden' ? 
                OUTPUT.removeAttribute('style') :
                OUTPUT.style.height = '40vh';
        });

        $("#emojis").picker(
            emoji => {
                MESSAGE.value += emoji;
                MESSAGE.focus();
            }
        );

    });
}