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

	jsasteroids.main = function(){
		initSinCosLUT();
		jsasteroids.html5av = document.createElement('video').load != undefined;
		jsasteroids.no_video = navigator.productSub == "20090423";
		jsasteroids.data = new ResourceLoader();
		data.load('img', 'player_ship', 'assets/spaceship.png');
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
	}
		$(function(){main()});

	}


