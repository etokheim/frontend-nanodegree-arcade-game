// Setup
var debugging = {
	"collision": {
		"boolean": false,
		"displayTarget": function(object) {
			if(this.boolean) {
				if(Object.prototype.toString.call( object ) === '[object Array]') {
					for (var i = 0; i < object.length; i++) {
						ctx.beginPath();
						ctx.strokeStyle = "#FF0000";
						ctx.rect(object[i].x, object[i].collisionY, object[i].width, object[i].height);
						ctx.stroke();
					}
				} else {
					ctx.beginPath();
					ctx.strokeStyle = "#FF0000";
					ctx.rect(object.x, object.collisionY, object.width, object.height);
					ctx.stroke();
				}
			}
		}
	}
},

	scoreTable = {
	"render": function() {
		var canvas = document.getElementsByTagName("canvas")[0];
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.font = "24px Arial";
		ctx.textAlign = "center";
		ctx.textBaseline = "top";
		ctx.fillText("Score: " + player.score, canvas.width / 2, 32);
	},

	"displayFinalScore": function() {
		if(!timer.playAgain) {
			var canvas = document.getElementsByTagName("canvas")[0];
			ctx.fillStyle = "rgb(0, 0, 0)";
			ctx.font = "50px Arial";
			ctx.textAlign = "center";
			ctx.textBaseline = "top";
			ctx.fillText("Final score: " + player.highScore, canvas.width / 2, canvas.height / 2 - 40);
			ctx.font = "16px Arial";
			ctx.fillText("Refresh page to play again! :)", canvas.width / 2, canvas.height / 2 + 20);
		}
	}
},

	tiles = {
		"width": 101,
		"height": 82,
		"padding": {
			"top": 50
		}
	},

	timer = {
	"gameTime": 20,
	"startTime": 0,
	"time": 0,
	"timing": false,
	"playAgain": true,
	"currentTime": 0,

	"timeNow": function() {
		if(timer.timing) {
			this.time = Date.now();
			this.currentTime = this.gameTime - (this.time - this.startTime) / 1000;
			console.log(this.currentTime);
		}
	},

	"restartTimer": function() {
		this.startTime = Date.now();
		this.timing = true;
	},

	"display": function() {
		var canvas = document.getElementsByTagName("canvas")[0];
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.font = "24px Arial";
		ctx.textAlign = "left";
		ctx.fillText("Time left: " + this.currentTime.toFixed(2), canvas.width / 2 - 75, canvas.height - 60);
	}
};

var enemyIndex = 0;

// Enemies our player must avoid
var Enemy = function() {
	// Variables applied to each of our instances go here,
	// we've provided one for you to get started

	var canvas = document.getElementsByTagName("canvas")[0];

	// The image/sprite for our enemies, this uses
	// a helper we've provided to easily load images
	this.sprite = 'images/enemy-bug.png';

	this.width = 101;
	this.height = 83;
	this.x = 0 - this.width;
	this.y = 53 + Math.floor(Math.random()*3) * this.height;
	// Seems like a random number? It is, its the placement where
	// i thought the the ladybugs would look best
	this.collisionY = this.y + 82;
	this.vx = 100 + Math.random()*100;
	this.index = enemyIndex;
	enemyIndex++;
	this.newEnemyInterval = 25;
	this.maxEnemies = 5;
};

var lastTime = Date.now();
var storedAppDt = 0;

Enemy.prototype.send = function() {

}

Enemy.prototype.update = function(dt, index) {
	// You should multiply any movement by the dt parameter
	// which will ensure the game runs at the same speed for
	// all computers.

	var canvas = document.getElementsByTagName("canvas")[0];

	// Checks if this is out of bounds
	if(this.x > canvas.width) {
		// If out of bouds, then deletes the element.
		allEnemies.splice(index, 1);
	}

	this.x += this.vx * dt;

	var now = Date.now(),
		appDt = (now - lastTime) / 1000;

	if(storedAppDt > this.newEnemyInterval && allEnemies.length < this.maxEnemies) {
		allEnemies.push(new Enemy);

		storedAppDt = 0;
	} else {
		storedAppDt++;
	}
};


// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
	debugging.collision.displayTarget(allEnemies);
	ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function() {
	this.x = 202;
	this.defaultX = 202;

	this.y = 375;
	this.defaultY = 375;
	// To offset the collision box
	this.collisionY = this.y + 75 + 17;
	this.defaultCollisionY = this.defaultY + 75 + 17;
	this.width = 101;
	this.height = 83;
	this.sprite = 'images/char-boy.png';

	this.score = 0;
	this.highScore = 0;

	this.xSpeed = 101;
	this.ySpeed = 83;

	this.resetPosition = function() {
		this.x = this.defaultX;
		this.collisionY = this.defaultCollisionY;
		this.y = this.defaultY;
	}

	this.movement = true;
};



// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
var allEnemies = [];

var player = new Player();

allEnemies.push(new Enemy);
Player.prototype.update = function() {
	if(player.collisionY < tiles.padding.top) {
		player.score += 10;
		player.resetPosition();
	}

	if(timer.timing) {
		// If times up:
		if (timer.currentTime <= 0) {
			// If new record, then sets new high score
			if(player.score > player.highScore) {
				player.highScore = player.score;
			}

			// Sets the timer before the confirm message - so it doesn't say -0.00
			timer.timing = false;
			timer.currentTime = 0.00;
			timer.display();
			player.resetPosition();

			if(confirm("Time's up! Your score: " + player.score + " - Well done!\n\nClick OK to play again, cancel to give up")) {
				// Sets new high score if new record
				player.score = 0;
			} else {
				player.movement = false;
				timer.playAgain = false;
			}
		}
	} else {
		if(timer.playAgain) {
			timer.restartTimer();
		}
	}
};

Player.prototype.render = function() {
	var canvas = document.getElementsByTagName("canvas")[0];

	debugging.collision.displayTarget(player);
	ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Player.prototype.handleInput = function(input) {
	var canvas = document.getElementsByTagName("canvas")[0];

	if(player.movement) {
		// if(input === "up" && this.collisionY - this.ySpeed > 0) {
		if(input === "up") {
			this.y -= this.ySpeed;
			this.collisionY -= this.ySpeed;
		}

		if(input === "down" && this.collisionY + this.ySpeed < canvas.height - 138) {
			this.y += this.ySpeed;
			this.collisionY += this.ySpeed;
		}

		if(input === "right" && this.x + this.xSpeed < canvas.width) {
			this.x += this.xSpeed;
		}

		if(input === "left" && this.x - this.xSpeed > -1) {
			this.x -= this.xSpeed;
		}
	}
};


// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keydown', function(e) {
	var allowedKeys = {
		37: 'left',
		38: 'up',
		39: 'right',
		40: 'down'
	};

	player.handleInput(allowedKeys[e.keyCode]);
});


var checkCollisions = function() {
	for (var i = 0; i < allEnemies.length; i++) {
		if (allEnemies[i].x + allEnemies[i].width > player.x && allEnemies[i].x < player.x + player.width &&
			allEnemies[i].collisionY + allEnemies[i].height > player.collisionY && allEnemies[i].collisionY < player.collisionY + player.height) {
			player.score -= 5;
			player.resetPosition();
		}
	}
};