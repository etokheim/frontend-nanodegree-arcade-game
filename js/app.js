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
};

var lastTime = Date.now();
var storedAppDt = 0;

Enemy.prototype.send = function() {
	this.newEnemyInterval = 25;
	this.maxEnemies = 5;

	var now = Date.now(),
		appDt = (now - lastTime) / 1000.0;

	if(storedAppDt > this.newEnemyInterval && allEnemies.length < this.maxEnemies) {
		allEnemies.push(new Enemy);

		storedAppDt = 0;
	} else {
		storedAppDt++;
	}
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

};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
	// var canvas = document.getElementsByTagName("canvas")[0];
	// ctx.clearRect(0, 0, canvas.width, canvas.height);
	var canvas = document.getElementsByTagName("canvas")[0];
	for (var i = 0; i < allEnemies.length; i++) {
		ctx.beginPath();
		ctx.strokeStyle = "#FF0000";
		ctx.rect(allEnemies[i].x, allEnemies[i].collisionY, allEnemies[i].width, allEnemies[i].height);
		ctx.stroke();
	}
	ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function() {
	this.x = 202;
	this.y = 375;
	// To offset the collision box
	this.collisionY = this.y + 75 + 17;
	this.width = 101;
	this.height = 83;
	this.sprite = 'images/char-boy.png';
};



// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
var allEnemies = [];
for (var i = 0; i < allEnemies.length; i++) {
	console.log(allEnemies[i]);
}

var player = new Player();

Player.prototype.update = function() {

};

Player.prototype.render = function() {
	console.log("Height = " + this.height + ", CollisionY = " + this.collisionY + ", y = " +  this.y);
	var canvas = document.getElementsByTagName("canvas")[0];

	ctx.beginPath();
	ctx.rect(this.x, this.collisionY, this.width, this.height);
	ctx.strokeStyle = "#FF0000";
	ctx.stroke();
	ctx.closePath();
	ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Player.prototype.handleInput = function(input) {
	if(input === "up") {
		this.y -= 83;
		this.collisionY -= 83;
	}

	if(input === "right") {
		this.x += 100;
	}

	if(input === "down") {
		this.y += 83;
		this.collisionY += 83;
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


var checkCollisions = function() {
	for (var i = 0; i < allEnemies.length; i++) {
		if (allEnemies[i].x + allEnemies[i].width > player.x && allEnemies[i].x < player.x + player.width &&
			allEnemies[i].collisionY + allEnemies[i].height > player.collisionY && allEnemies[i].collisionY < player.collisionY + player.height) {
			alert("collision!");
		}
	}
};