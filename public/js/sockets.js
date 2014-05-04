
window.onload = function() {

    // connect client to server
	var socket = io.connect(window.location.hostname);

	//when both users are ready
	socket.emit('ready', 'user is ready');  

	//--msg from server
	socket.on('message',function(data){
	    console.log(data);
	});
	socket.on('users',function(data){
	    game.levels.num_players = data;
	});
	socket.on('usersReady', function(data){

		console.log('users ready');
		game.levels.load_first();
		
	});	
	socket.on('newScore', function(data){
		game.play.add_point(data);
	});
	socket.on('removeDiv', function(data){
		var div =  $('.show div[data-name="' + data.name + '"]')[0];
		game.play.remove_option(div);
		
	});
	socket.on('newNumCorrect', function(data){
		
		game.play.num_correct = data.num;
		
		if(game.play.num_correct == 2){
			$('.show').remove();
		};
	});
	socket.on('nextDiv', function(data){
		$('.show').remove();
		game.play.go_to_level(data.num);	
	});
	socket.on('gameOver', function(){
		game.levels.load_winner();
	});
	socket.on('blockUser', function(){
		
		$('.start').remove();
		$('.game').remove();
		$('.block').fadeIn('fast');
		
	});
	socket.on('quitter', function(){
		var check = $('.show');
		console.log(check);
		if(check.length > 0){
			game.levels.load_winByDefault();
		};
	});
	
	//--loose coupling from app
	game.events.subscribe('user:ready', function(){
		socket.emit('userReady', {num : 1});
	});
	game.events.subscribe('points:score', function(el){		
		socket.emit('updateScore', {
			user : socket.myid,
			points : el
		});		
	});
	game.events.subscribe('select:correct', function(el){
		socket.emit('updateDiv', {
			div : el
		});
	});
	game.events.subscribe('update:correct', function(el){
		socket.emit('updateCorrect', {
			num : el
		});
	});
	game.events.subscribe('level:next', function(el){
		socket.emit('updateLevel', {
			level : el
		}); 
	});
	game.events.subscribe('levels:none', function(){
		socket.emit('gameOver', {});
	});

};


