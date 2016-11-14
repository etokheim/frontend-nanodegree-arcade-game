/*--------------------------------------------------------------
>>> TABLE OF CONTENTS:
----------------------------------------------------------------
# Setup
# Enemy
# Player
# Collision checking
--------------------------------------------------------------*/


/*--------------------------------------------------------------
# Setup
--------------------------------------------------------------*/
document.addEventListener('keydown', function(e) {
	var allowedKeys = {
		37: 'left',
		38: 'up',
		39: 'right',
		40: 'down'
	};

	player.handleInput(allowedKeys[e.keyCode]);
});

var setup = {
	"debugging": {
		"collision": {
			"boolean": true,
			"displayCollisionArea": function(object) {
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
						ctx.rect(object.collisionX, object.collisionY, object.width, object.height);
						ctx.stroke();
					}
				}
			}
		}
	},

},

gameBoard = {
	"tiles": {
		"width": 101,
		"height": 82,
		"padding": {
			"top": 50
		}
	},

	"info": {
		"scoreTable": function() {
			var canvas = document.getElementsByTagName("canvas")[0];
			ctx.fillStyle = "rgb(0, 0, 0)";
			ctx.font = font.h2();
			ctx.textAlign = "center";
			ctx.fillText("Score: " + player.score, canvas.width / 2, font.size.h2);
		},

		"render": function() {
			this.scoreTable();
		},

		"displayFinalScore": function() {
			if(!timer.playAgain) {
				var canvas = document.getElementsByTagName("canvas")[0];
				ctx.fillStyle = "rgb(0, 0, 0)";
				ctx.font = font.h1();
				ctx.textAlign = "center";
				ctx.fillText("Final score: " + player.highScore, canvas.width / 2, canvas.height / 2 - 40);
				ctx.font = font.p();
				ctx.fillText("Refresh page to play again! :)", canvas.width / 2, canvas.height / 2 + 20);
			}
		}
	},
},

font = {
	"family": "Arial",
	"size": {
		"default": 16,
		"h1": 50,
		"h2": 25,
	},

	"p": function() {
		return this.size.default + "px " + this.family;
	},

	"h1": function() {
		return this.size.h1 + "px " + this.family;
	},

	"h2": function() {
		return this.size.h2 + "px " + this.family;
	},
},


timer = {
	"gameTime": 99999999999,
	"startTime": 0,
	"time": 0,
	"timing": false,
	"playAgain": true,
	"currentTime": 0,

	"timeNow": function() {
		if(timer.timing) {
			this.time = Date.now();
			this.currentTime = this.gameTime - (this.time - this.startTime) / 1000;
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
		ctx.fillText("Time left: " + this.currentTime.toFixed(2), canvas.width / 2 - 75, canvas.height - 10);
	}
};


/*--------------------------------------------------------------
# Enemy
--------------------------------------------------------------*/
var enemyIndex = 0;

var lastTime = Date.now();
// var dt = 0;
var dt;
var now;
var timeSinceNewEnemy = 0;

function Enemy() {
	var canvas = document.getElementsByTagName("canvas")[0];

	// Utilizes resources.js to load image
	this.sprite = 'images/enemy-bug.png';

	this.width = 96;
	this.height = 65;
	this.x = 0 - this.width;
	this.y = 53 + Math.floor(Math.random()*3) * gameBoard.tiles.height;

	// Seems like a random number? It is, its the placement where
	// i thought the the ladybugs would look best
	this.collisionY = this.y + 82;

	this.vx = 2; // 100 + Math.random() * 100;
	this.index = enemyIndex;
	enemyIndex++;
	this.newEnemyInterval = 2;
	this.maxEnemies = 5;
	this.moveInterval = 1000; // Value in seconds
	this.isMoving = false;
	this.startPosition = this.x;
	this.lastMoveTime = Date.now();
}

Enemy.prototype.move = function(direction, multiplier) {
	if(Date.now() - this.lastMoveTime > this.moveInterval) {
		this.isMoving = true;
		if(this.startPosition + this.x - this.startPosition > this.startPosition + gameBoard.tiles.width) {
			this.startPosition = this.x;
			this.isMoving = false;
			this.lastMoveTime = Date.now();
		} else {
			this.x += this.vx;
		}
	}
};

function EnemySpawner() {

}

EnemySpawner.prototype.send = function() {
};


// *** PROBLEM ***
// The enemy.update function only runs if there is enemies in allEnemies array
// Therefor the spawner CANNOT be embedded in this function! If there is no enemies
// No new ones will spawn!!!
Enemy.prototype.update = function(dt, index) {
	// Multiplied by dt in order to ensure all computers play at the same speed

	// Checks if this is out of bounds
	if(this.x > canvas.width) {
		// If out of bouds, then deletes the element.
		allEnemies.splice(index, 1);
	}

	// this.x += this.vx * dt;
	this.move("x", 1);

	now = Date.now(),
	dt = (now - lastTime) / 1000.0;
	// console.log(dt + ", and 2 * dt = " + 2*(dt+1));

	if(timeSinceNewEnemy > this.newEnemyInterval && allEnemies.length < this.maxEnemies) {
		allEnemies.push(new Enemy);

		timeSinceNewEnemy = 0;
	} else {
		timeSinceNewEnemy += dt;
	}
	// console.log(timeSinceNewEnemy + ", " + this.newEnemyInterval);
	lastTime = Date.now();
};

Enemy.prototype.render = function() {
	setup.debugging.collision.displayCollisionArea(allEnemies);
	ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

var allEnemies = [];
allEnemies.push(new Enemy);


/*--------------------------------------------------------------
# Player
--------------------------------------------------------------*/
// var Player.prototype = new Enemy;
var Player = function() {
	this.x = 202;
	this.defaultX = 202;
	this.defaultCollisionX = this.x + 30;
	this.collisionX = this.x + 30;
	this.xDifferenceHitBoxAndDrawing = this.collisionX - this.x;

	this.y = 375;
	this.defaultY = 375;
	// To offset the collision box
	this.collisionY = this.y + 75 + 17 + 25;
	this.yDifferenceHitBoxAndDrawing = this.collisionY - this.y;
	this.defaultCollisionY = this.defaultY + 75 + 17 + 25;
	this.width = 45;
	this.height = 30;
	this.sprite = 'images/char-boy.png';

	this.score = 0;
	this.highScore = 0;

	this.xSpeed = 101;
	this.ySpeed = 83;


	this.movement = true;

	startPosition = this.x;
};

Player.prototype.resetPosition = function() {
	this.x = this.defaultX;
	this.collisionX = this.defaultCollisionX;
	this.collisionY = this.defaultCollisionY;
	this.y = this.defaultY;
	this.isMoving = false;
}

Player.prototype.update = function() {
	if(player.collisionY < gameBoard.tiles.padding.top) {
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

	this.animate();
};

Player.prototype.render = function() {
	var canvas = document.getElementsByTagName("canvas")[0];

	setup.debugging.collision.displayCollisionArea(player);
	ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Player.prototype.animate = function(direction, multiplier) {
	var moveDistance;
	var deltaPosition;
	if(direction2 === "y") {
		moveDistance = gameBoard.tiles.height;
		position = this.collisionY;
	} else {
		moveDistance = gameBoard.tiles.width;
		position = this.collisionX;
	}


	if(this.isMoving) {		
		deltaPosition = this.startPosition - position;
		if(Math.abs(deltaPosition) >= moveDistance) {
			this.startPosition = position;
			this.isMoving = false;
			this.lastMoveTime = Date.now();
			console.log("Stop animating player!");
		} else {
			// if move speed is say 15, the player will run more than 82 px (a tile) up!
			position = (position + (moveDistance / 8) * multiplier2);
			console.log(multiplier2 + "Animating player! this.startPosition = " + this.startPosition + ", position = " + position + ", moveDistance = " + moveDistance + ", deltaPosition = " + deltaPosition);
			// position -= moveDistance / 8;
		}
		if(direction2 === "y") {
			this.collisionY = position;// * multiplier2;
			this.y = (position - this.yDifferenceHitBoxAndDrawing);// * multiplier2;
		} else {
			this.collisionX = position;// * multiplier2;
			this.x = (position - this.xDifferenceHitBoxAndDrawing);// * multiplier2;
		}
	}
}

var direction2, multiplier2;

Player.prototype.move = function(direction, multiplier) {
	console.log("moving player!");
	this.isMoving = true;
	direction2 = direction;
	multiplier2 = multiplier;
	
	if(direction2 === "y") {
		this.startPosition = this.collisionY;
	} else {		
		this.startPosition = this.collisionX;
	}
};

Player.prototype.handleInput = function(input) {
	var canvas = document.getElementsByTagName("canvas")[0];

	if(player.movement) {
		// if(input === "up" && this.collisionY - this.ySpeed > 0) {
		if(input === "up") {
			// this.y -= this.ySpeed;
			// this.collisionY -= this.ySpeed;
			this.move("y", -1)
		}

		if(input === "down" && this.collisionY + this.ySpeed < canvas.height - 138) {
			// this.y += this.ySpeed;
			// this.collisionY += this.ySpeed;
			this.move("y", 1)
		}

		if(input === "right" && this.x + this.xSpeed < canvas.width) {
			// this.x += this.xSpeed;
			// this.collisionX += this.xSpeed;
			this.move("x", 1)
		}

		if(input === "left" && this.x - this.xSpeed > -1) {
			// this.x -= this.xSpeed;
			// this.collisionX -= this.xSpeed;
			this.move("x", -1)
		}
	}
};

var player = new Player();


/*--------------------------------------------------------------
# Collision checking
--------------------------------------------------------------*/
var checkCollisions = function() {
	for (var i = 0; i < allEnemies.length; i++) {
		if (allEnemies[i].x + allEnemies[i].width > player.collisionX && allEnemies[i].x < player.collisionX + player.width &&
			allEnemies[i].collisionY + allEnemies[i].height > player.collisionY && allEnemies[i].collisionY < player.collisionY + player.height) {
			player.score -= 5;
			player.resetPosition();
		}
	}
};