/*--------------------------------------------------------------
>>> TABLE OF CONTENTS:
----------------------------------------------------------------
# Setup
# Abillities
# Enemy
# Player
	## Controls
# Collision checking
--------------------------------------------------------------*/


/*--------------------------------------------------------------
# Setup
--------------------------------------------------------------*/
var doc = document,
	win = window,
	canvasElement = doc.createElement('canvas'),
	ctx = canvasElement.getContext('2d'),
	lastTime;

doc.body.appendChild(canvasElement);

var canvas = document.getElementsByTagName("canvas")[0];

// Resizes the canvas with the window size
function setCanvasSize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight-4;
}

setCanvasSize();

window.addEventListener("resize", function() {
	gameBoard.calculateTileSize();
	gameBoard.padding.calculate();
	setCanvasSize();
});

document.addEventListener('keydown', function(event) {
	var allowedKeys = {
		37: 'left',
		38: 'up',
		39: 'right',
		40: 'down'
	};

	player.handleInput(allowedKeys[event.keyCode]);
});

var setup = {
	"debugging": {
		"collision": {
			// Enable/disable debugging
			"boolean": false,

			// Displays a red rectangle to visualize collision area/hit box
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

font = {
	"family": "Arial",
	"size": {
		"default": 16, // px
		"h1": 50, // px
		"h2": 25, // px
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
	"gameTime": 200000, // Seconds
	"startTime": 0, // Seconds
	"time": 0, // Seconds
	"timing": false,
	"playAgain": true,
	"currentTime": 0, // Seconds

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

// Game board constructor
function GameBoard() {
	var that = this;

	this.columns = 5;
	this.rows = 6;


	this.tiles = {
		defaultWidth: 101,
		width: 101,
		defaultHeight: 82,
		height: 82,
		padding: {
			"top": 50
		}
	};

	this.padding = {
		left: 0,

		calculate: function() {
			this.left = canvas.width / 2 - (that.columns / 2) * that.tiles.width;
		}
	};

	this.padding.calculate();

	this.maxWidth = this.tiles.width * this.columns;

	this.calculateTileSize = function() {
		if(canvas.width > that.maxWidth) {
			that.tiles.width = that.tiles.defaultWidth;
			that.tiles.height = that.tiles.defaultHeight;
		} else if(canvas.width < that.maxWidth) {
			that.tiles.width = canvas.width / that.columns;

			var percentage = that.tiles.width / that.tiles.defaultWidth;
			that.tiles.height = that.tiles.defaultHeight * percentage;
		}
	},

	this.info = {
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
	}
}



/*--------------------------------------------------------------
# Abilities
--------------------------------------------------------------*/
// All moving objects should have this function as a prototype
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
	// If not moving; move
	if(!this.isMoving) {
		this.isMoving = true;
		this.moving.direction = direction;
		this.moving.multiplier = multiplier;

		// Set start position of movement
		if(this.moving.direction === "y") {
			this.startPosition = this.y;
		} else {
			this.startPosition = this.x;
		}

		// If player doesn't move - this is not a queued move.
		this.nextMove.queued = false;

	// Else; (if moving) let player queue a move
	// This way the player doesn't have to wait until the animation
	// ends before executing his next move.
	} else {
		if(this.description.userControlled) {
			this.nextMove = {
				"direction": direction,
				"multiplier": multiplier,
				"queued": true
			};
		}
	}
};

// Animates "this"
// Runs continuously from ###.prototype.update
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

		// Calculate movement
		// If "this" has moved the distance it's supposed to (moveDistance), then stop moving
		if(Math.abs(deltaPosition) >= moveDistance) {
			this.startPosition = this.moving.position;
			this.isMoving = false;
			this.timeOfLastMove = Date.now();

		// Else, continue to move
		} else {
			// if move speed is say 15, the player will run more than 82 px (a tile) up!
			this.moving.position += (moveDistance / 8 * this.moving.multiplier) * this.v;
		}

		// Actually move "this"
		if(this.moving.direction === "y") {
			this.y = this.moving.position;
			this.spriteOffsetY = (this.moving.position - this.spriteOffsetYDifferenceHitBoxAndDrawing);
		} else {
			this.x = this.moving.position;
			this.spriteOffsetX = (this.moving.position - this.spriteOffsetXDifferenceHitBoxAndDrawing);
		}
	}

	// If a move has been queued; move it!
	// I like to move it, move it
	// I like to move it, move it
	// I like to move it, move it
	// You like to:
	// --> Move it! <--
	if(this.nextMove.queued) {
		// If it's not moving player out of bounds
		// CONSIDER FIXING:
		// 		- This is less then ideal, but since enemies never have to queue a move
		// 		  it works. (Enemies are supposed to move out of bounds...)
		console.log(this.nextMove.multiplier);
		// If moving on the Y-axis and y position + y speed * moving direction is less than canvas height, then move
		if(this.nextMove.direction === "y" && this.y + this.spriteOffsetYSpeed * this.nextMove.multiplier < canvas.height - 100) {
			this.move(this.nextMove.direction, this.nextMove.multiplier);

		// Else if same except x-axis and is result is more than 0 and less than canvas.width
		} else if(this.nextMove.direction === "x" && this.spriteOffsetX + this.spriteOffsetXSpeed * this.nextMove.multiplier < canvas.width && this.spriteOffsetX - this.spriteOffsetXSpeed * this.nextMove.multiplier*-1 > -1) {
			this.move(this.nextMove.direction, this.nextMove.multiplier);
		}
	}
};


/*--------------------------------------------------------------
# Enemy
--------------------------------------------------------------*/
var enemyIndex = 0,
	lastTime = Date.now(),
	dt,
	now,
	maxEnemies = 5,
	newEnemyInterval = 1.5, // Value in seconds
	timeSinceNewEnemy = newEnemyInterval; // Default should be equal to newEnemyInterval in order to kick off the game sooner

// Enemy constructor
Enemy.prototype = new MovableObject();
function Enemy(x, y) {
	// Utilizes resources.js to load image
	this.sprite = 'images/enemy-bug.png';

	this.width = 96;
	this.height = 65;

	// This is more relevant for the player sprite but is meant to separate the hit box
	// from the sprite. See this.y for more.
	this.spriteOffsetX = x || 0 - this.width + gameBoard.padding.left;
	this.x = this.spriteOffsetX + gameBoard.padding.left;
	this.spriteOffsetXDifferenceHitBoxAndDrawing = this.x - this.spriteOffsetX;

	// If you look at the sprite pictures there is a lot of empty space, which should not
	// be a part of the hit box. Therefor some offsetting is necessary.
	this.spriteOffsetY = y || 53 + Math.floor(Math.random() * 3) * gameBoard.tiles.height;
	// Seems like a random number? It is, it's the placement where
	// I thought the the ladybugs would look best
	this.y = this.spriteOffsetY + 82;
	this.spriteOffsetYDifferenceHitBoxAndDrawing = this.y - this.spriteOffsetY;

	// v = velocity
	this.v = (Math.random() + 0.75) * 0.5;

	// Unique indexes are necessary when removing elements
	this.index = enemyIndex;
	enemyIndex++;

	// How often enemies move
	this.moveInterval = Math.random() * 500 + 500; // Value in milliseconds

	this.isMoving = false;
	this.startPosition = this.spriteOffsetX;
	this.timeOfLastMove = Date.now();
}

// Enemy creation logic, runs continuously from update() in engine.js
function enemySpawner() {
	now = Date.now();
	dt = (now - lastTime) / 1000.0;

	// Creates a new enemy if there is less enemies then maxEnemies and timeSinceNewEnemy
	// is greater then newEnemyInterval
	if(timeSinceNewEnemy > newEnemyInterval && allEnemies.length < maxEnemies) {
		allEnemies.push(new Enemy());
		timeSinceNewEnemy = 0;
	} else {
		timeSinceNewEnemy += dt;
	}

	lastTime = Date.now();
}

// Runs continuously from updateEntities() in engine.js
Enemy.prototype.update = function(dt, index) {
	// If "this" is out of bounds; delete it
	if(this.spriteOffsetX > canvas.width) {
		allEnemies.splice(index, 1);
	}

	this.animate();

	if(Date.now() - this.timeOfLastMove >= this.moveInterval) {
		this.move("x", 1);
	}
};

// Runs continuously from renderEntities() in engine.js
// Draws sprites to the canvas
Enemy.prototype.render = function() {
	setup.debugging.collision.displayCollisionArea(allEnemies);
	ctx.drawImage(Resources.get(this.sprite), this.spriteOffsetX, this.spriteOffsetY);
};

var allEnemies = [];


/*--------------------------------------------------------------
# Player
--------------------------------------------------------------*/
// Gives Player the MovableObjects abilities
Player.prototype = new MovableObject();

// Player constructor
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
	// Velocity
	this.v = 1;

	this.spriteOffsetXSpeed = 101;
	this.spriteOffsetYSpeed = 83;

	this.description.userControlled = true;
	this.movement = true;
	this.score = 0;
	this.highScore = 0;
}

// Moves the player to x, y
// If no values is passed to the parameters, they are set to player.defaultX/Y
Player.prototype.reposition = function(x, y) {
	x = x || this.defaultX;
	y = y || this.defaultY;

	this.spriteOffsetX = x - this.spriteOffsetXDifferenceHitBoxAndDrawing;
	this.x = x;
	this.y = y;
	this.spriteOffsetY = y - this.spriteOffsetYDifferenceHitBoxAndDrawing;
	this.isMoving = false;
};

// Runs continuously from updateEntities() in engine.js
Player.prototype.update = function() {
	// If player reaches the top of the board; increase score and reset position
	if(player.y < gameBoard.tiles.padding.top) {
		player.score += 10;
		player.reposition();
	}

	if(timer.timing) {
		// If time's up:
		if (timer.currentTime <= 0) {
			// If new record, then sets new high score
			if(player.score > player.highScore) {
				player.highScore = player.score;
			}

			// Sets the timer before the confirm message and renders the timer - so it doesn't say -0.00
			// Doesn't work for some reason...
			timer.timing = false;
			timer.currentTime = 0.00;
			timer.display();
			player.reposition();

			// Asks weather the player wants to play again or not
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

// Runs continuously from renderEntities() in engine.js
// Draws sprites to the canvas
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

// Watches touches on assigned element
function touchInputListener(element, callback) {
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
		// 			- this = player
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
// Runs continuously from update() in engine.js
function checkCollisions() {
	for (var i = 0; i < allEnemies.length; i++) {
		if (allEnemies[i].x + allEnemies[i].width > player.x && allEnemies[i].x < player.x + player.width &&
			allEnemies[i].y + allEnemies[i].height > player.y && allEnemies[i].y < player.y + player.height) {
			player.score -= 5;
			player.reposition();
		}
	}
};