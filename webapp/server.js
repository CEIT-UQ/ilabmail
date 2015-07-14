/*////////////////////////////////////////////

	Webapp server.
	Uses:
		- Serves Dashboard Content
		- Updates data.csv on mqtt
		- informs webapp when to update
		- Tweets on failures

*/////////////////////////////////////////////

	// General server
var express = require('express')
	app = express()
	server = require('http').createServer(app)

	// Updating the file
	mongo = require('mongojs')
	fs = require('fs')
	_ = require('underscore')
	mqtt = require('mqtt')
	spawn = require('child_process').spawn

	// Auto-update
	io = require('socket.io')(server)

	// Twitter feed output
	Twit = require('twit')

var T = new Twit(require('twitter_keys'))

// Start the server
var port = 55672;
server.listen(port, function() {
	console.log('Listening on: ' + port)
});

// Create the force-regen trigger for /regen
app.use('/regen', function(req,res,next){
	console.log('Someone forced a regeneration of the .csv')
	forceRegen()
	next()
})

app.use('/', express.static(__dirname + '/public'));

/* //////////////////////////////////////////////////////

		Handle the connection with the client through socket.io
*/
io.on('connection', function (socket) {
	console.log('a user connected with socket.io')
  	socket.on('disconnect', function(){
    	console.log('user disconnected')
  	})
  	socket.on('ans', function() {
  		console.log('socket was answered!')
  	})
})

function tellClientUpdate() {
	io.emit('new-data', {for :'everyone'})
}

/* //////////////////////////////////////////////////////

		The data.csv update portion of the server
*/
var last = process.hrtime() // get the first time

mqttClient = mqtt.connect('mqtt://winter.ceit.uq.edu.au')

mqttClient.on('connect', function() {
		mqttClient.subscribe('ilab/mail')
		forceRegen() // force a recreation on connection/startup
	})

mqttClient.on('message', function(topic, message) {
		// only update if it's been longer than x seconds
		x = 30
		console.log('There was a new message on ilab/mail')
		if (process.hrtime()[0] - last[0] >= x) {
			forceRegen()
			last = process.hrtime()
			console.log("Data file was updated")
		}

		message = JSON.parse(message.toString())

		// Lets do something with the imformation!
		tweetSomething(message)

		// Tell the client we have new data
		tellClientUpdate()
	})

function forceRegen() {
	console.log('Time of refresh: ' + new Date)
	var mongoDumpToCSV = spawn('sh', [ 'mongoDumpToCSV.sh' ], {
		cwd: process.env.PWD,
		env:_.extend(process.env, { PATH: process.env.PATH + ':/usr/local/bin' })
	});

	// Get all the output
	mongoDumpToCSV.stdout.on('data', function (data) {
		process.stdout.write("Script output {		" + data)
	});
}

function tweetSomething(msg) {
	t = ''
	// Tweet something if we got a failed experiment
	if (msg["StatusCode"] == "Failed") {
		t = 'Oh no! Experiment #'+msg["Experiment Id"]+', '+msg['Setup']+' run by someone from '+msg["Usergroup"]+' just failed because '+msg["Error Message"];
		// Lets also tweet about it because this is important!
		tweet(t)
	}

	// Other events here:
}

/*
	Tweet whatever m is. It needs to be a string
*/
function tweet(m) {
	T.post('statuses/update', { status: m }, function(err, data, response) {
		if(err) {
			console.log("We tried but couldn't tweet: " + err)
		} else {console.log('Just tweeted: '+m)}
	})
}


/* ///////////////////////////////////////////////////////////

		Commandline args to force the server to do something
*/
process.stdin.on('readable', function () {
	var chunk = process.stdin.read()
	if (chunk !== null) {
		process.stdout.write('command: '+chunk)
		// 'rs' to reload the
		if (chunk == "rs\n") {
			process.stdout.write('Regenerating public/data.csv\n')
			forceRegen()

		// Tweet everything after a starting '@'
		} else if (chunk.toString().charAt(0) == "@") {
			process.stdout.write("We're sending a tweet now\n")
			tweet(chunk.toString().substring(1))

		// Check if clients are alive
		} else if (chunk == "cu\n") {
			console.log("Sending the update message to all connected clients")
			tellClientUpdate()
		}
	}
})
