const socket = io();
{
    const capitalize = string => string.split('').map( (e,i) => i == 0 ? e.toUpperCase() : e ).join('');

    const getRecipient = message => {
        let conjunto = [...message.matchAll(/\@([\wáéíóú]+)/gi)];
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

    const executeCommand = message => {
        let command = '';
        switch (message) {
            case ( command = message.match(/^\/([1-9]|1[0-9]|20)?d(2|4|6|8|10|12|20|30|100)((\+|\-)(\d{1,}))?(\*(2|3|4|5|6|7|8|9|10|11|12))?$/)?.input ):
                return rollDices(command);
            default:
                return message;
        }
    }

    const getUserList = userList => {
        let list = '';
        userList = userList.filter( e => e.name !== '' );
        userList.forEach( e => {
            list += `
                <div class='user'>
                    <div class="connected"></div>${e.name}
                </div>`;
        });
        return list;
    }

    document.addEventListener("DOMContentLoaded", () => {
        const CHAT_CONTAINER = document.getElementById("chat-container");
        const LOGIN          = document.getElementById("login");
        const INPUT_USERNAME = document.getElementById("input_username");
        const SEND_USERNAME  = document.getElementById("send_username");
        const USERS_LIST     = document.getElementById("users_list");
        const MESSAGE        = document.getElementById("message");
        const USERNAME       = document.getElementById("username");
        const BUTTON_SEND    = document.getElementById("send");
        const BUTTON_ICON    = document.getElementById("icons-button");
        const ICON_LIST      = document.getElementById("icon-list");
        const OUTPUT         = document.getElementById("output");
        const ACTIONS        = document.getElementById("actions");

        let login = false;
        let userName = '';
    
        $("#icon-list").disMojiPicker();
        twemoji.parse(document.body);

        /* Introducir nombre usuario */
        INPUT_USERNAME.addEventListener("keyup", () => {
            INPUT_USERNAME.value = INPUT_USERNAME.value.replace(/\s+/g, "").slice(0,10);;
        });
        SEND_USERNAME.addEventListener("click", () => {
            socket.emit( 'chat:username-select', capitalize(INPUT_USERNAME.value) );
        });
        socket.on( 'chat:validate-username', data => {
            if (!data) {
                INPUT_USERNAME.nextElementSibling.innerText = 'Nick not available';
                return;
            }
            LOGIN.style.display = 'none';
            CHAT_CONTAINER.removeAttribute("style");
            login = true;
            USERNAME.innerText = userName = capitalize(INPUT_USERNAME.value);
        });

        /* Enviar mensaje */
        const sendMessage = ev => {
            ev.preventDefault();
            if (MESSAGE.value == '' || userName == '') return;
            let recipient = getRecipient( MESSAGE.value );
            let message = { 
                from: userName, 
                to: recipient, 
                message: recipient == '' ? 
                    executeCommand( MESSAGE.value ) : 
                    executeCommand( MESSAGE.value.replace(/\s?\,\s?(\w)/, ' $1').match(/\@[\wáéíóú]+\s([^\,].+)$/i)?.[1] )
            };
            socket.emit( 'chat:message', message );
            socket.emit( 'chat:typing', { from: userName, message: '' } );
            MESSAGE.value = "";
            ICON_LIST.className = 'hidden';
            OUTPUT.removeAttribute('style');
        }
    
        /* Recibir mensajes */
        socket.on('chat:message', data => {   //Actualización del chat
            if (!login) return;
            if (data.alert) {
                if ( /^\s/.test(data.message) ) return;
                OUTPUT.innerHTML += `<p class='server-message user-${/\sconnected$/.test(data.message) ? 'connected' : 'disconnected'}'>${data.message}</p>`;
            }
            else {
                if ( data.to !== '' && ( data.from == userName || data.to.match( userName.toLowerCase() ) ) ) 
                    OUTPUT.innerHTML += `
                        <p class='careless-whisper'>
                            <b>
                                ${data.time} ${data.from !== userName ? 'From' : 'To'} 
                                @${data.from !== userName ? data.from : data.to.split(', ').map( e => capitalize(e) ).join(', ')}:
                            </b> 
                                ${data.message}
                        </p>`;
                else if (data.to == '')
                    OUTPUT.innerHTML += `
                        <p>
                            <b>${data.time} ${ data.from == userName ? 'Me' : data.from }:</b> ${data.message}
                        </p>`;
            }
            OUTPUT.scroll(0, OUTPUT.scrollHeight );
        });

        //Lista de usuarios conectados
        socket.on( 'chat:users-list', data => {
            if (!login) return;
            if (data) USERS_LIST.innerHTML = getUserList(data);
        });

        socket.on('chat:typing', data => {    //Mensaje de quién está escribiendo
            if (data.from == userName) return;
            ACTIONS.innerHTML = data.message == '' ? '' : `<small>${data.from} is writting now</small>`;
        });
    
        //Send message
        BUTTON_SEND.addEventListener("click", sendMessage);
        MESSAGE.addEventListener("keydown", (ev) => {
            if (ev.key == 'Enter' || ev.key == 'NumpadEnter') 
                sendMessage(ev);
            else {
                if (userName == '') return;
                if ( /^\@/.test(MESSAGE.value) || (ev.code == 'Backspace' || ev.code == 'Delete' && MESSAGE.value == '') ) 
                    socket.emit( 'chat:typing', { from: userName, message: '' } );
                else
                    socket.emit( 'chat:typing', { from: userName, message: MESSAGE.value } );
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