/** 
 * Asteroids game for Javascript
 * @author jpknie@utu.fi, 2011 
 **/
if(typeof(console) == 'undefined') console = {log: function() {}}
var proto = window.CanvasRenderingContext2D.prototype;
// detecting the font property results in a security error so we'll just use
// measureText instead
if(proto.mozMeasureText && !proto.measureText) {
	proto.__defineSetter__('font', function(x) { this.mozTextStyle = x;});
	proto.__defineGetter__('font', function() { return this.mozTextStyle;});
}
if(proto.mozMeasureText && !proto.measureText) {
	console.log('wrapping measureText');
	proto.measureText = function(text) { return {'width': this.mozMeasureText(text)}; };
}
if(proto.mozPathText && !proto.strokeText) {
	console.log('wrapping strokeText');
	proto.strokeText = function(text, x, y) {
		this.translate(x, y);
		this.mozPathText(text);
		this.stroke();
		this.translate(-x, -y);
	};
}
if(proto.mozDrawText && !proto.fillText) {
	console.log('wrapping fillText');
	proto.fillText = function(text, x, y) {
		this.translate(x, y);
		this.mozDrawText(text);
		this.translate(-x, -y);
	};
}

function Canvas(w, h){
	var buffer = document.createElement('canvas');
	buffer.setAttribute('width', w);
	buffer.setAttribute('height', h);
	return buffer;
}

function fillTextMultiline(ctx, text, x, y, h) {
	if(!$.isArray(text)) {
		text = text.split('\n');
	}
	for(var i = 0; i < text.length; i ++){
		ctx.fillText(text[i], x, y);
		y += h;
	}
}

function drawAndRotate(ctx, img, dw, dh) {
	var colDu = sinLUT[angle];
	var colDv = cosLUT[angle];
	var rowDu = colDv;
	var rowDv = -colDu;
	var srcCx = img.width/2;
	var srcCy = img.height/2;
	var dstCx = dw/2;
	var dstCy = dh/2;
	var startingu = srcCx - (dstCx * colDv + dstCy * colDu);
	var startingv = srcCy - (dstCx * rowDv + dstCy * rowDu);
	var rowu = startingu;
	var rowv = startingv;
	var u=0;
	var v=0;
	for(var y=0; y < height; y++)
	{
		u = rowu;
		v = rowv;
		
		for(var x=0; x < width; x++)
		{
			u += rowDu;
			v += rowDv;
		}
		rowu += colDu;
		rowv += colDv;
	}
}


function drawImage(myContext, img, x, y, size, rotate) {
            var halfS = size / 2;
			
           /* var imageCursor = new Image();
            imageCursor.src = imgSrc; */
            myContext.save();
            var tX = x + halfS;
            var tY = y + halfS;
            myContext.translate(tX, tY);
            myContext.rotate(Math.PI / 180 * rotate);
            var dX = 0, dY = 0;
            if (rotate == 0) { dX = 0; dY = 0; }
            else if (rotate > 0 && rotate < 90) { dX = 0; dY = -(size / (90 / rotate)); }
            else if (rotate == 90) { dX = 0; dY = -size; }
            else if (rotate > 90 && rotate < 180) { dX = -(size / (90 / (rotate - 90))); dY = -size; }
            else if (rotate == 180) { dX = dY = -size; }
            else if (rotate > 180 && rotate < 270) { dX = -size; dY = -size + (size / (90 / (rotate - 180))); }
            else if (rotate == 270) { dX = -size; dY = 0; }
            else if (rotate > 270 && rotate < 360) { dX = -size + (size / (90 / (rotate - 270))); dY = 0; }
            else if (rotate == 360) { dX = 0; dY = 0; }
            myContext.drawImage(img, dX, dY, size, size);
            myContext.restore();
        }


var sinLUT = [];
var cosLUT = [];

function initSinCosLUT() {
	for(var i = 0; i < 720; i++) {
		sinLUT[i] = Math.sin(i * Math.PI/180.0);
		cosLUT[i] = Math.cos(i * Math.PI/180.0);
	}
}

var keyname = {
	32: 'SPACE',
	13: 'ENTER',
	9: 'TAB',
	8: 'BACKSPACE',
	16: 'SHIFT',
	17: 'CTRL',
	18: 'ALT',
	20: 'CAPS_LOCK',
	144: 'NUM_LOCK',
	145: 'SCROLL_LOCK',
	37: 'LEFT',
	38: 'UP',
	39: 'RIGHT',
	40: 'DOWN',
	33: 'PAGE_UP',
	34: 'PAGE_DOWN',
	36: 'HOME',
	35:	'END',
	45: 'INSERT',
	46: 'DELETE',
	27: 'ESCAPE',
	19: 'PAUSE',
	222: "'"
};

jsasteroids = {};
with(jsasteroids) {

	jsasteroids.Timer = function() {
		var self = this;
		self.ontick = function() {

		}
		self.last = new Date().getTime()/1000;
		self.tick = function() {
			var current = new Date().getTime()/1000;
			self.ontick(current-self.last);
			self.last = current;
		}
		self.set_rate = function(rate) {
			self.rate = rate;
			if(self.interval)
				clearInterval(self.interval);
				self.interval = setInterval(self.tick, 1000/rate);
		}
	}

	jsasteroids.KeyTracker = function() {
		var self = this;
		self.focus = true;
		self.reset = function() {
			var code;
			for(code in keyname) {
				self[keyname[code]] = false;
			}
		}
		var keydown = $(document).keydown(function(event) {
			console.log('keydown event');
			self[keyname[event.keyCode]] = true;
			return !self.focus;
		});
		var keyup = $(document).keyup(function(event) {
			self[keyname[event.keyCode]] = false;
			return !self.focus;
		});
	}

	jsasteroids.Starship = function(game, img) {
		var self = this;
		self.angle = 355;			/** The angle (in degrees) of the ship */
		self.direction = [sinLUT[self.angle],-cosLUT[self.angle]];	/** The direction (unit vector) of star ship */
		self.acceleration = [0.0, 0.0]; /** The acceleration vector */
		self.velocity = [0.0,0.0];		/** The velocity vector */
		self.position = [];		/** Position of star ship */
		self.ACCEL_CONSTANT = 4.0; /** Some acceleration constant for thrust */
		self.img = img;
		self.width = img.width;
		self.height = img.height;
		self.integer = 0;

		self.tick = function(dt) {
			var position = self.position;
			var velocity = self.velocity;
			/** Add time*vel to position */
			position[0] += dt*velocity[0];
			position[1] += dt*velocity[1];
		}

		self.incrementAngle = function () {
			var direction = self.direction;
			self.angle = ((self.angle + 5) % 360);
			/** update direction vector */
			direction[0] = sinLUT[self.angle];
			direction[1] = -cosLUT[self.angle];
		}

		self.decint = function() {
			self.integer--;
			console.log("integer: "+self.integer);
		}
		self.incint = function() {
			self.integer++;
			console.log("integer: "+self.integer);
		}

		self.decrementAngle = function () {
			if((self.angle - 5) == 0) self.angle = 360;
			else self.angle-=5;
			var direction = self.direction;
		
			/** update direction vector */
			direction[0] = sinLUT[self.angle];
			direction[1] = -cosLUT[self.angle];
			self.direction = direction;
		}

		self.thrust = function () {
			var velocity = self.velocity;
			var direction = self.direction;
			var ACCEL_CONSTANT = self.ACCEL_CONSTANT;
			velocity[0] += direction[0] * ACCEL_CONSTANT;
			velocity[1] += direction[1] * ACCEL_CONSTANT;
		}

		self.draw = function(ctx) {
			var img = self.img;
			var position = self.position;
			drawImage(ctx, img, position[0], position[1], self.width, self.angle);
			/*
			var tempctx = 
			img.rotate(self.angle * Math.PI / 180);
			ctx.drawImage(img, 0, 0, 
			self.width, 
			self.height, 
			position[0], 
			position[1], 
			self.width, 
			self.height);*/
		}
	};

	jsasteroids.main = function() {
		initSinCosLUT();
		jsasteroids.html5av = document.createElement('video').load != undefined;
		jsasteroids.no_video = navigator.productSub == "20090423";
		jsasteroids.data = new ResourceLoader();
		data.load('img', 'player_ship', 'assets/spaceship.png');
		data.load('img', 'background0', 'assets/background0.jpg');
		data.player_ship.frames=1;
		data.background0.layer_num=0;
		if(html5av) {
			//data.load('audio', 'explosion_sound', 'assets/explosion.ogg');
		}
		jsasteroids.screen = $('#screen');
		jsasteroids.width = screen.width();
		console.log('screen width: ', width);
		jsasteroids.height = screen.height();
		console.log('screen height: ', height);
		jsasteroids.ctx = screen[0].getContext('2d');
		jsasteroids.keys = new KeyTracker();
		jsasteroids.timer = new Timer();
		screen.click(function() {
			keys.focus = true;
		});
		$('input').add('textarea').click(function() {
			keys.focus = false
		});
  		 ctx.restore();
		 jsasteroids.menu = new jsasteroids.Menu();
		
	}
	jsasteroids.ResourceLoader = function() {
		this.total = 0;
		this.loaded = 0;
	}

	jsasteroids.ResourceLoader.prototype.load = function(type, name, url) {
		var self = this;
		var data = document.createElement(type);
		self[name] = data;
		self.total++;
		$(data).one('error', function() {
			console.log('error', url);
			self.loaded++;
		});
		if(type == 'video' || type == 'audio') {
			$(data).one('canplaythrough', function() 
			{
				data.setAttribute('autobuffer', 'autobuffer');
				data.setAttribute('src', url);
				data.load();
			}
		)
		}
		else 
		{
			data.setAttribute('src', url);
			$(data).one('load', function() 
			{ 
				console.log('loaded', url); self.loaded++; 
			});

		}

		jsasteroids.Menu = function() {
			var self = this;
			var menuItems = [
					['New Game', function() { self.exit(); jsasteroids.game = new Game(); }],
					['Highscores', function() { self.exit(); new Highscores(); }],
					['Credits', function() { self.exit(); new Credits(); }]					
				];
			var selected = 0;
			ctx.save();
			function draw() {
				ctx.fillStyle = 'black';
				ctx.fillRect(0, 0, width, height);
				ctx.font = 18 + 'px Impact';
				for(var i = 0; i < menuItems.length; i++) {
					ctx.fillStyle = (i == selected) ? 'red': 'gold';
					var itemText = menuItems[i][0];
					var itemTextWidth = ctx.measureText(itemText).width;
					ctx.fillText(itemText, (width-itemTextWidth)/2, 200+i*18*1.5);
				}
			}
			this.enter = function() {
				timer.ontick = draw;
				timer.set_rate(10);
				$(document).bind('keydown.menu', function(event) {
					if(!keys.focus) return;
					if(event.keyCode == 40) {
						selected++;
						selected %= menuItems.length;
					}
					if(event.keyCode == 38) {
						selected--;
						if(selected < 0) selected = menuItems.length-1;
					}
					if(event.keyCode == 32 || event.keyCode == 13) {
						menuItems[selected][1]();
					}
				});
			}
			this.enter();
			this.exit = function() {
				$(document).unbind('keydown.menu');
			}
		}
		jsasteroids.ParallaxScroller = function (game, img) 
		{
			var self = this;
			self.img = img;
			self.draw = function(ctx) {
				ctx.drawImage(img, 0, 0);
			}
		}
		jsasteroids.Highscores = function() { }
		jsasteroids.Credits = function() { } 
		jsasteroids.Game = function() 
		{
			var self = this;
			console.log("initializing new game...");
			jsasteroids.keys.reset();
			self.player = new Starship(this, jsasteroids.data.player_ship);
			self.background = new ParallaxScroller(this, jsasteroids.data.background0);
			self.player.position[0] = jsasteroids.width/2;
			self.player.position[1] = jsasteroids.height/2;
			self.t = 0;
			ctx.save();

			function draw() {
				self.background.draw(ctx);
				self.player.draw(ctx);
			}

			timer.ontick = function(td) {
				if(self.paused) return;
				self.t += td;
				var player = self.player;
				if(keys.LEFT) {
					player.decrementAngle();
				}
				if(keys.RIGHT) {
					player.incrementAngle();
				}
				if(keys.UP) {
					player.thrust();

				}
					self.player.tick(td);
				draw();
			}
		}

	}
	$(function(){main()});
}




