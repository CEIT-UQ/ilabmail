/*////////////////////////////////////////////////

	This creates a socket with the webserver and 
	waits to be told that data.csv has been updated
	then reloads only the data.csv for an updated graph

*/////////////////////////////////////////////////

var socket = io()

socket.on('new-data', function (d) {
	console.log('Refresh the page to use up to date data')
	socket.emit('ans', "received")
	myEle = document.querySelector("#new-data")
	myEle.style.display = "initial" // reveal the link
})