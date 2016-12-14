/*--------------------------------------------------------------
>>> TABLE OF CONTENTS:
----------------------------------------------------------------
# Setup
# Abillities
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
			"boolean": false,

			"displayCollisionArea": function(object) {
				if(this.boolean) {
					// If parameter is an array, treat it like one
					if(Object.prototype.toString.call( object ) === '[object Array]') {
						for (var i = 0; i < object.length; i++) {
							ctx.beginPath();
							ctx.strokeStyle = "#FF0000";
							ctx.rect(object[i].x, object[i].y, object[i].width, object[i].height);
							ctx.stroke();
						}
					// Else treat it as an object
					} else {
						ctx.beginPath();
						ctx.strokeStyle = "#FF0000";
						ctx.rect(object.x, object.y, object.width, object.height);
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
	"gameTime": 20, // In seconds
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
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.font = "24px Arial";
		ctx.textAlign = "left";
		ctx.fillText("Time left: " + this.currentTime.toFixed(2), canvas.width / 2 - 75, canvas.height - 10);
	}
};


/*--------------------------------------------------------------
# Abillities
--------------------------------------------------------------*/
function MovableObject() {
	this.description = {
		"userControlled": false, // Sets default value
	};

	this.moving = {
		"isMoving": false,
		"direction": "", // x or y
		"position": 0,
		"multiplier": 1 // 1 or -1 - inverts moving direction
	};

	this.nextMove = {};
}

// This functions runs (all the time) from ###.prototype.update()
MovableObject.prototype.move = function(direction, multiplier) {
	if(!this.isMoving) {
		this.isMoving = true;
		this.moving.direction = direction;
		this.moving.multiplier = multiplier;
		if(this.moving.direction === "y") {
			this.startPosition = this.y;
		} else {		
			this.startPosition = this.x;
		}

		// If player doesn't move - this is not a queued move.
		this.nextMove.queued = false;
	} else {
		// If player is moving - let player queue a move.
		// This way the player doesn't have to wait till the animation
		// to end before executing his next move.
		if(this.description.userControlled) {
			this.nextMove = {
				"direction": direction,
				"multiplier": multiplier,
				"queued": true
			};
		}
	}
};

MovableObject.prototype.animate = function() {
	var moveDistance;
	var deltaPosition;

	if(this.moving.direction === "y") {
		moveDistance = gameBoard.tiles.height;
		this.moving.position = this.y;
	} else {
		moveDistance = gameBoard.tiles.width;
		this.moving.position = this.x;
	}

	if(this.isMoving) {	
		deltaPosition = this.startPosition - this.moving.position;
		if(Math.abs(deltaPosition) >= moveDistance) {
			this.startPosition = this.moving.position;
			this.isMoving = false;
			this.lastMoveTime = Date.now();
			// console.log("Stop animating player!");
		} else {
			// if move speed is say 15, the player will run more than 82 px (a tile) up!
			this.moving.position += (moveDistance / 8 * this.moving.multiplier) * this.v;
			// console.log("Animating! Direction = " + this.moving.direction + ", this.startPosition = " + this.startPosition + ", position = " + this.moving.position + ", moveDistance = " + moveDistance + ", deltaPosition = " + deltaPosition);
		}

		if(this.moving.direction === "y") {
			this.y = this.moving.position;
			this.spriteOffsetY = (this.moving.position - this.spriteOffsetYDifferenceHitBoxAndDrawing);
		} else {
			this.x = this.moving.position;
			this.spriteOffsetX = (this.moving.position - this.spriteOffsetXDifferenceHitBoxAndDrawing);
		}
	}

	// If a move has been queued - fire it!
	if(this.nextMove.queued) {
		// If it's not moving player out of bounds
		if(this.nextMove.direction === "y" && this.y + this.spriteOffsetYSpeed < canvas.height - 100) {
			this.move(this.nextMove.direction, this.nextMove.multiplier);
		} else if(this.nextMove.direction === "x" && this.spriteOffsetX + this.spriteOffsetXSpeed < canvas.width && this.spriteOffsetX - this.spriteOffsetXSpeed > -1) {
			this.move(this.nextMove.direction, this.nextMove.multiplier);
		}
	}
};

/*--------------------------------------------------------------
# Enemy
--------------------------------------------------------------*/
var enemyIndex = 0;

var lastTime = Date.now();
var dt;
var now;
var timeSinceNewEnemy = 0;

var asdf;
function test(a) {
	asdf = a || Math.random();
}

Enemy.prototype = new MovableObject();
function Enemy(x, y) {
	// Utilizes resources.js to load image
	this.sprite = 'images/enemy-bug.png';

	this.width = 96;
	this.height = 65;

	this.spriteOffsetX = x || 0 - this.width;
	this.x = this.spriteOffsetX;
	this.spriteOffsetXDifferenceHitBoxAndDrawing = this.x - this.spriteOffsetX;

	this.spriteOffsetY = y || 53 + Math.floor(Math.random() * 3) * gameBoard.tiles.height;

	// Seems like a random number? It is, it's the placement where
	// I thought the the ladybugs would look best
	this.y = this.spriteOffsetY + 82;
	this.spriteOffsetYDifferenceHitBoxAndDrawing = this.y - this.spriteOffsetY;

	this.v = (Math.random() + 0.75) * 0.5;
	this.index = enemyIndex;
	enemyIndex++;
	this.moveInterval = Math.random() * 500 + 500; // Value in milli seconds
	this.isMoving = false;
	this.startPosition = this.spriteOffsetX;
	this.lastMoveTime = Date.now();
	this.maxEnemies = 5;
	this.newEnemyInterval = Math.random() * 2 + 1; // Value in seconds
}

function enemySpawner() {
	this.maxEnemies = 5;
	this.newEnemyInterval = Math.random() * 2 + 1; // Value in seconds	

	now = Date.now();
	dt = (now - lastTime) / 1000.0;

	if(timeSinceNewEnemy > this.newEnemyInterval && allEnemies.length < this.maxEnemies) {
		allEnemies.push(new Enemy());

		timeSinceNewEnemy = 0;
	} else {
		timeSinceNewEnemy += dt;
	}

	lastTime = Date.now();
}

Enemy.prototype.update = function(dt, index) {
	// Multiplied by dt in order to ensure all computers play at the same speed

	// Checks if this is out of bounds
	if(this.spriteOffsetX > canvas.width) {
		// If out of bouds; delete the element.
		allEnemies.splice(index, 1);
	}

	this.animate();

	if(Date.now() - this.lastMoveTime >= this.moveInterval) {
		this.move("x", 1);
	}
};

Enemy.prototype.render = function() {
	setup.debugging.collision.displayCollisionArea(allEnemies);
	ctx.drawImage(Resources.get(this.sprite), this.spriteOffsetX, this.spriteOffsetY);
};

var allEnemies = [];
allEnemies.push(new Enemy());
allEnemies[0].move("x", 1);


/*--------------------------------------------------------------
# Player
--------------------------------------------------------------*/
Player.prototype = new MovableObject();
function Player() {
	this.spriteOffsetX = 202;
	this.defaultX = 202;
	this.defaultX = this.spriteOffsetX + 30;
	this.x = this.spriteOffsetX + 30;
	this.spriteOffsetXDifferenceHitBoxAndDrawing = this.x - this.spriteOffsetX;

	this.spriteOffsetY = 375;
	this.defaultY = 375;
	// To offset the collision box
	this.y = this.spriteOffsetY + 75 + 17 + 25;
	this.spriteOffsetYDifferenceHitBoxAndDrawing = this.y - this.spriteOffsetY;
	this.defaultY = this.defaultY + 75 + 17 + 25;
	this.width = 45;
	this.height = 30;
	this.sprite = 'images/char-boy.png';
	this.v = 1;

	this.spriteOffsetXSpeed = 101;
	this.spriteOffsetYSpeed = 83;

	// Player attributes
	this.description.userControlled = true;
	this.movement = true;
	this.score = 0;
	this.highScore = 0;
}

Player.prototype.resetPosition = function() {
	this.spriteOffsetX = this.defaultX - this.spriteOffsetXDifferenceHitBoxAndDrawing;
	this.x = this.defaultX;
	this.y = this.defaultY;
	this.spriteOffsetY = this.defaultY - this.spriteOffsetYDifferenceHitBoxAndDrawing;
	this.isMoving = false;
};

Player.prototype.update = function() {
	if(player.y < gameBoard.tiles.padding.top) {
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
	setup.debugging.collision.displayCollisionArea(player);
	ctx.drawImage(Resources.get(this.sprite), this.spriteOffsetX, this.spriteOffsetY);
};

var player = new Player();


/*-------------------
## Controls
---------------------*/
Player.prototype.handleInput = function(input) {
	if(player.movement) {
		// "click" is equal to a touch
		if(input === "up" || input === "click") {
			this.move("y", -1);
		}

		if(input === "down" && this.y + this.spriteOffsetYSpeed < canvas.height - 100) {
			this.move("y", 1);
		}

		if(input === "right" && this.spriteOffsetX + this.spriteOffsetXSpeed < canvas.width) {
			this.move("x", 1);
		}

		if(input === "left" && this.spriteOffsetX - this.spriteOffsetXSpeed > -1) {
			this.move("x", -1);
		}
	}
};

function thisIsATest(element, callback) {
	// console.log("Touch events initialized on " + element);

	var callbackFunction = callback || function() {console.log("No callback. Result = " + swipe.direction);};

	var touch = {
		object: {},

		start: {
			x: 0,
			y: 0
		},

		end: {
			x: 0,
			y: 0
		},	
	};

	var swipe = {
		threshold: 25,
		angleThreshold: 100,
		distance: {
			x: 0,
			y: 0
		}
	};
	
	element.addEventListener("touchstart", function() {
		touch.object = event.changedTouches[0];
		touch.start.x = touch.object.pageX;
		touch.start.y = touch.object.pageY;
	}, false);

	element.addEventListener("touchend", function() {
		touch.object = event.changedTouches[0];
		touch.end.x = touch.object.pageX;
		touch.end.y = touch.object.pageY;

		swipe.distance.x = touch.start.x - touch.end.x;
		swipe.distance.y = touch.start.y - touch.end.y;

		// If swiping horizontally
		if(Math.abs(swipe.distance.x) >= swipe.threshold && Math.abs(swipe.distance.y) < swipe.angleThreshold) {
			if(swipe.distance.x > 0) {
				swipe.direction = "left";
			} else {
				swipe.direction = "right";
			}
		// Else if swiping vertically
		} else if(Math.abs(swipe.distance.y) >= swipe.threshold && Math.abs(swipe.distance.x) < swipe.angleThreshold) {
			if(swipe.distance.y > 0) {
				swipe.direction = "up";
			} else {
				swipe.direction = "down";
			}
		// Else if swipe distance is less than swipe threshold, handle touch input as a click
		} else if(Math.abs(swipe.distance.y) < swipe.threshold && Math.abs(swipe.distance.x) < swipe.threshold) {
			swipe.direction = "click";
		} else {
			swipe.direction = false;
		}

		// .call makes the first parameter define the this keyword within the function
		// In example:
		// 		- callbackFunction(swipe.direction)
		// 			- this = Window
		//
		// 		- callbackFunction.call(player, swipe.direction);
		callbackFunction.call(player, swipe.direction);

	}, false);

	element.addEventListener("touchcancel", function() {
		swipe.direction = false;
	}, false);

	// Prevents scrolling
	element.addEventListener("touchmove", function() {
		event.preventDefault();
	}, false);
}

/*--------------------------------------------------------------
# Collision checking
--------------------------------------------------------------*/
var checkCollisions = function() {
	for (var i = 0; i < allEnemies.length; i++) {
		if (allEnemies[i].x + allEnemies[i].width > player.x && allEnemies[i].x < player.x + player.width &&
			allEnemies[i].y + allEnemies[i].height > player.y && allEnemies[i].y < player.y + player.height) {
			player.score -= 5;
			player.resetPosition();
		}
	}
};