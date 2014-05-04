var game = game || {};

//--events manager
game.events = (function() {

	var publish = function (name, o) {
       
        console.log("EVENT [" + name + "]", o);
        $(document).trigger(name, [o]);
    
    };

    var subscribe = function (name, callback) {
        
        $(document).on(name, function(event, o){            
            callback(o);
        });

    };

    return {
    	publish : publish,
    	subscribe : subscribe
    }; 

})();

//--songs manager
game.songs = (function(){
	
	//get list of levels from json file
	var list =  function(){
		var json = null;
  
		//--get json list of songs
	    $.ajax({
	        'async': false,
	        'global': false,
	        'url': "files/list.json",
	        'dataType': "json",
	        'success': function (data) {
	            json = data;
	        }
	    });
		
		//push artists + related artists to options list
		json.forEach(function(elem, index, array){
			var options = [];
		
			//--push artists to options list
			elem.artists.forEach(function(artists){
				options.push(artists);
			});
	
			//--push related artist to options list
			elem.related.forEach(function(relartist){
				options.push(relartist);
			});
	
			//--shuffle options		
			options.sort(function() {
			  return .5 - Math.random();
			});
			
			//add options to element in json object
			elem.options = options;
			
		});
	
		return json;
	};
	
	//use underscore to load songs + options into html
	var load = function(){

		var	template,
		feedSrc,
		renderFeed;
		
		feedSrc = list();
		template = $('.song-template').text();
		renderFeed = _.template(template);		
		$(renderFeed({songs : feedSrc })).appendTo('.song');	
			
	};
	
	//play song by div number
	var play = function(){
		var div = $('.show');

		if(div){
			var thisSong = div[0].getElementsByTagName("audio")[0];
			thisSong.play();
		}else{
			console.log('error', div);
		}
	};
	
	//pause song by div number
	var pause = function(){
		var div = $('.show');

		if(div){
			var thisSong = div[0].getElementsByTagName("audio")[0];
			thisSong.pause();
		}else{
			console.log('error', div);
		}
	};
	
	//check answers
	var answer_check = function(name, num){
				
		var thisArtist = list()[num].artists;
		
		if(name == thisArtist[0] || name == thisArtist[1]){
			return true
		}else{
			return false
		}
		
	};

	//auto-load song list	
	load();
	
	//export
	return {
		play : play,
		pause : pause,
		check : answer_check
	}

})();

//--play manager
game.play = (function(){
	
	var click_listener = function(){
	
		$('.artist_options').click(function(e){
			e.preventDefault();
			click_manager(this);
		});	
		
	};
	
	//if guess is correct, do this. if guess is wrong, do that.
	var click_manager = function(div){
	
		var name,
			num,
			answer,
			parent,
			msg = {};
			
		name = $(div).text();
		num = $(div).data('song');
		answer = game.songs.check(name, num);
		parent = $(div).parents('div')[0];
		
		
		if(answer == true){
			score_point();
			
			remove_option(div);
			msg.name = name;
			msg.num = num;
			game.events.publish('select:correct', msg);
			
			correct(parent);
		}else{
			console.log('nope!', div);
		}
		
	};
	
	var my_points = 0;
	var opp_points = 0;
	
	//add a point to current user and broadcast to other users
	var score_point = function(){
		my_points ++;
		$('.mypoints').text(my_points);
		game.events.publish('points:score', my_points);

	};
	
	//add a point to other user's score
	var add_point = function(data){
		opp_points = data.score;
		$('.opppoints').text(opp_points);	
	};

	//remove option from current user and broadcast to other users	
	var remove_option = function(div){
		div.remove();		
	};
		
	//number of correct guesses
	var num_correct = 0;
	
	//if num correct is equal to 2, advance to the next level
	var correct = function(parent_div){

		game.play.num_correct++;

		if(game.play.num_correct == 2){
			$('.show').remove();
			game.play.num_correct = 0;
			choose_level();
			game.events.publish('update:correct', 0);
		}else{
			game.events.publish('update:correct', 1);
		};			

	};
	
	//advance current user and other users to next level
	var choose_level = function(){
		
		num_correct = 0;
		var max,
			min,
			num;
		
		//select new random div
		min = 0;
		max = $('.this_song').length;
		if(max != 1 && max != 0){ 
			max = max-1; 
		};
		
		if(max == 0){
			game.events.publish('levels:none', '');
		};
		
		num = Math.floor(Math.random() * (max - min) + min);
		var div = $('.this_song')[num];
		var songID = $(div).data('song');

		var div =  $('div[data-song="' + songID + '"]')[0];
		
		if(div){
			game.events.publish('level:next', songID);	
			go_to_level(songID);
			
		};

		
		
	};

	//go to level using songID
	var go_to_level = function(songID){

		//define new div
		var div =  $('div[data-song="' + songID + '"]')[0];
				
		//show new div
		$(div).css('background-color', 'pink').toggleClass('show');

		//play song in new div
		game.songs.play();

	};
	
	click_listener();
	
	return {
		add_point : add_point,
		remove_option : remove_option,
		go_to_level : go_to_level,
		num_correct : num_correct
	}
	
})();

//--levels manager
game.playState = (function(){
	
	var num_players,
		ready_players = 0;
	
	
	//welcome screen
	var landing = function(){
		
		$('.welcome').click(function(){
			$('.welcome').hide();
			$('.ready').show();
			readyCheck();
			
		});
		
	};
	
	//load ready screen
	var readyCheck = function(){
		console.log('ready check!');
		$('.readyClick').click(function(){
			game.events.publish('user:ready', '');
		});
	};
	
	//if click ready and first user, go to waiting screen
	var waiting = function(){
	
		$('.ready').hide();
		$('.waiting').show();
		
	};

	//if both users ready, load countdown and call firstSong after 3 seconds	
	var countdown = function(){
		
		$('.start').hide();
		$('.ready').hide();
		$('.waiting').hide();
		$('.countdown').show();

		setTimeout(function(){
			$('.countdown h2').empty().text('2');
		}, 1*1000)
		
		setTimeout(function(){
			$('.countdown h2').empty().text('1');
		}, 2*1000)
		
		setTimeout(function(){
			$('.countdown h2').empty().text('0');
		}, 3*1000)
		
		setTimeout(function(){
			$('.countdown').hide();
			game.playState.firstSong();
		}, 4*1000)
		
	};

	//begin gameplay with firstSong	
	var firstSong = function(){
		$('.game').show();
		var first = $('.this_song')[0];
		$(first).toggleClass('show');
		game.songs.play();
	};
	
	var load_winner = function(){

		$('.game').fadeOut();
		$('.end').fadeIn();
		
		var myscore,
			oppscore;
			
		myscore = parseInt($('.mypoints').text());
		oppscore = parseInt($('.opppoints').text());
		
		if(myscore > oppscore){
			$('.win').fadeIn();
		}else if(myscore < oppscore){
			$('.lose').fadeIn();
		}else if(myscore == oppscore){
			$('.tie').fadeIn();
		}
		
	};
	
	var load_winByDefault = function(){
		$('.start').fadeOut();
		$('.game').fadeOut();
		$('.end').fadeIn();
		$('.quit').fadeIn();
	};
	
	landing();
	//firstSong();
	
	return {
		num_players : num_players,
		ready_players : ready_players,
		waiting : waiting,
		countdown : countdown,
		firstSong : firstSong,
		load_winner : load_winner,
		load_winByDefault : load_winByDefault,
	}
	

})();
