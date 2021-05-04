socket = io("http://localhost:3000")

const messageForm = document.getElementById('send-container')
const msgInput = document.getElementById('input-msg')
const messageContainer = document.getElementById('msg-container')


let name = prompt("Enter your name")
socket.emit('new-user', name)
appendMessage(`You have joined`)

socket.on('user-connected', user => {
    console.log('user connected', user)
    appendMessage(`${user} have joined`)
})

socket.on('get-msg', data => {
    appendMessage(`${data.name} : ${data.message}`)
})

socket.on('user-disconnect', name => {
    appendMessage(`${name} have left chat`)
})

messageForm.addEventListener('submit', evt => {
    evt.preventDefault()
    msg = msgInput.value
    appendMessage(`You : ${msg}`)
    socket.emit('send-message', msg)
    msgInput.value = ''
})

function appendMessage(msg) {
    const msgElement = document.createElement('p')
    msgElement.innerText = msg
    messageContainer.append(msgElement)
}