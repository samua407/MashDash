
var http = require('http');
var util = require('util');

var connect = require('connect');

var port = process.env.PORT || 5000; // defaults to localhost:5000 when run locally

var app = connect.createServer(
	connect.static(__dirname + "/public")
).listen(port);

util.log("server running at port: " + port);

var io = require("socket.io").listen(app);

var onlineUsers = [];
var readyUsers = 0;

io.set('log level', 2); // showing only significant log such as handshaking and data transmission

io.sockets.on('connection', function(socket) { // when a user, "socket" connects

	onlineUsers++;
	
	if(onlineUsers > 2){
		util.log('### sorry, too late');
		socket.emit('blockUser', {});
	}else{
		util.log('number of user: ' + onlineUsers);
		io.sockets.emit('users', onlineUsers); // emit to all
	};

	socket.on('userReady', function(){
		console.log('## user ready');
		
		readyUsers++;
		
		if(readyUsers == 2){
			io.sockets.emit('usersReady', {});
			readyUsers = 0;
		}else{
			console.log(readyUsers, " ready user(s).");
		};
		
	});
	socket.on('updateScore', function(data) {
		socket.broadcast.emit('newScore', { // send it to everyone else
			user: data.user,
			id: socket.id,
			score: data.points
		});
	});
	socket.on('updateDiv', function(data) {
		socket.broadcast.emit('removeDiv', { // send it to everyone else
			id: socket.id,
			name : data.div.name,
			num : data.div.num
		});
	});
	socket.on('updateLevel', function(data){
		socket.broadcast.emit('nextDiv', {
			num : data.level
		});
	});
	socket.on('updateCorrect', function(data){
		socket.broadcast.emit('newNumCorrect', {
			num : data.num
		});
	});
	socket.on('gameOver', function(){
		io.sockets.emit('gameOver', {});		
	});	
	socket.on('removeDiv', function(data) {
		console.log(data);
	});
	socket.on('disconnect', function() {
		onlineUsers--; // reduce user count
		io.sockets.emit('quitter', {});
		util.log('the user #' + socket.id + ' has just disconnected');
		util.log('number of user: ' + onlineUsers);
	});


});

