var enemyIndex = 0;

// Enemies our player must avoid
var Enemy = function() {
	// Variables applied to each of our instances go here,
	// we've provided one for you to get started

	var canvas = document.getElementsByTagName("canvas")[0];

	// The image/sprite for our enemies, this uses
	// a helper we've provided to easily load images
	this.sprite = 'images/enemy-bug.png';

	this.x = 0 - 101;
	this.y = 43 + Math.round(Math.random()*2) * 83;
	this.vx = Math.random()*150;
	this.index = enemyIndex;
	// console.log(enemyIndex);
	enemyIndex++;
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
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
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
	ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function() {
	this.x = 200;
	this.y = 375;
	this.sprite = 'images/char-boy.png';
};



// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
var allEnemies = [new Enemy, new Enemy,  new Enemy,  new Enemy];
for (var i = 0; i < allEnemies.length; i++) {
	console.log(allEnemies[i]);
}

var player = new Player();

Player.prototype.update = function(dt) {

};

Player.prototype.render = function() {
	ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Player.prototype.handleInput = function(input) {
	if(input === "up") {
		this.y -= 83;
	}

	if(input === "right") {
		this.x += 100;
	}

	if(input === "down") {
		this.y += 83;
	}

	if(input === "left") {
		this.x -= 100;
	}
};


// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
	var allowedKeys = {
		37: 'left',
		38: 'up',
		39: 'right',
		40: 'down'
	};

	player.handleInput(allowedKeys[e.keyCode]);
});
