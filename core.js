var Jimp = require("jimp");
const N = 1920;
const M = 1024;
const zoom = 0.5*1000;
const outer_iter = 80000;
const inner_iter = 1000;

function replaceAll(source, search, replacement) {
    
    return source.split(search).join(replacement);
};

function chunk (arr, len) {

  var chunks = [],
      i = 0,
      n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, i += len));
  }

  return chunks;
}


function hexToRgb(hex) {
    var result = /([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16)/255,
        g: parseInt(result[2], 16)/255,
        b: parseInt(result[3], 16)/255
    } : null;
}



function Create2DArray(rows,cols) {
  var arr = [];

  for (var i=0;i<rows;i++) {
     arr[i] = [];
     for (var j = 0; j < cols; j++) {
     	arr[i][j]={r: 0, g: 0, b: 0, a: 0}
     }
  }

  return arr;
}

function R(x,y) {
	return Math.sqrt(x*x + y*y);
}

function Theta(x,y) {
	return Math.atan2(y,x);
}

function julia(power,dist,x,y) {
	var p3 = Math.trunc(Math.random()*power);
	var t = (Theta(x,y) +2*Math.PI*p3)/power;
	var r =R(x,y);
	x=Math.pow(r,dist/power)*Math.cos(t);
	y=Math.pow(r,dist/power)*Math.sin(t);
	return [x,y];
}

function transform(x,y, matrix) {
	var a=x*matrix[0][0]+matrix[0][1]*y+matrix[0][2];
	var b=x*matrix[1][0]+matrix[1][1]*y+matrix[1][2];
	return [a,b];
}

function id(x,y){
	return [x,y];
}

function maxM(matrix)
{
	var max =0;
	for(var i = 0; i < matrix.length; i++) {
		for (var j = 0; j < matrix[0].length; j++) {
			max = matrix[i][j]>max?matrix[i][j]:max;
		}
	}
	return max;
}

var field = Create2DArray(N+1,M+1);

var model = 
{

	count: 3,
	1: {
		color: 0,
		speed: -0.635,
		matrix: [ [1,0,0.8],[0,1,0] ],
		variation: julia.bind(this,12,2)
	},
	0: {
		color: 1,
		speed: 0,
		matrix: [ [0.74653,-0.200032,0],[0.200032,0.74653,0] ],
		variation: id
	},
	
	2: {
		color: 0,
		speed: 0,
		matrix: [ [25,0,5],[0,25,0] ],
		variation: julia.bind(this,24,5)
	},
	palette:
	` A42D349C27319D222A9B1B269A1524980A2198082098061F
      98061E99071E97091FA00D1DB6141BBB151BC1171BCD1B1B
      DA1D1AE42019EF2418F32718F62B18F93117F93217F93318
      FA361AFB361CFC371EFC3A21F74625F54A26F44F28F3592C
      F2612FF26A33F37138F3783DF57D42F88641F78E42F69A41
      F5A745F3B248F3BB4CF3C24FF4C457F5C357F7C358F9C15A
      F9C058FBC45AFAC75CFACB61FAD166FAD56DFAD573FAD378
      F7CD7DF6C47FF7BE7DF7B679F7B076F7AB74F7A673F8A06F
      FA996AFA9064F9855EF97856F96A4CF95B43F94D3BF73F35
      F73130F6272BF21F27EC1925E81422E61020E50B1DE6081C
      E6081BE8081BE90719EA0818E80919E60B1AE50F1CE4131C
      E5181DE7211FEB2D22EF3925F54629F9532DFB6132FC6F3A
      FC7A40FC8145FC8648FC894AF9894CF3874DE8834EDE804E
      D9814ED8854FD88A53D99058DA9259DE9259E28F57E18A54
      DC8151D8774CD77045D76B42D96F44E1834AEB904DF69D51
      F8A353FBA956FAA855F9A755F29A4EF0944DEF8F4CEF8A4B
      EF854AEF8047F07C45F17B44F27A44F27340F0703FEE6E3E
      EE6B3EEF693FEF673FEF663FF45F3DF85C3CFC593BFC593C
      FC5A3EFA5B3EF85D3FEB603DDE5E3CC6583AB95138AD4B37
      A24336973C359538369435377C2B3176252E71202B701925
      6F13206F0F1D6F0C1B7306178003179305179C0A19A60F1B
      B2181EBE2221C42823CB2E26E34830EC5434F56039F76B3E
      FA7643FA7C45FB8347FB904EFC9F55FCBD65FCC96DFDD676
      FDDA79FDDF7DFDE684FDEA87FDED88FDEB85FDE982FAE57C
      F8E176F4DF73F0DD70EED46CEECB68EEB862EFB460F0B05E
      F0AD5DF1AB5CF6AC5AF0B059EEB25CEDB360EDB565EDB668
      EEB76CEFBC74F2BF7DFAC488FCCE91FCE4A2FCECA7FCF5AD
      FCF7AEFCF9AFFDFAB0FDF9AEFDF5A7FDF1A3FDEDA0FCEB9E
      FCEA9DFCE497FCDC90FDD289FDC581FDAB6DFDA467FD9D62
      FE8D59FD8053FE754DFD6A48FE5542FD4E3EFD473BFD4439
      FD4138FE3D36FE3935FE3834FE3833FC3833FC3832FC3832
      FB3833F63933EB3834DF3836C73637BB3436AF3236A92F35`
}

model.gradient = chunk(replaceAll(model.palette,/\s/,""),6).map( hexToRgb )

function plot(x,y, c)
{
	var coord = Math.floor(c*255);
	field[Math.round(N/2+x*zoom)][Math.round(M/2+y*zoom)].r += model.gradient[coord].r;
	field[Math.round(N/2+x*zoom)][Math.round(M/2+y*zoom)].g += model.gradient[coord].g;
	field[Math.round(N/2+x*zoom)][Math.round(M/2+y*zoom)].b += model.gradient[coord].b;
	field[Math.round(N/2+x*zoom)][Math.round(M/2+y*zoom)].a +=1;
}

var core = function()
{
	for (var i = 0; i < outer_iter; i++) {
		var x = 1- Math.random()*2;
		var y = 1-Math.random()*2;
		var c = Math.random();
		var pointer;
		var speed;
		var inner1 =[], inner2 =[];
		for (var j = 0; j < inner_iter; j++) {
			pointer = Math.trunc(model.count*Math.random());
			var inner1 = transform(x,y, model[pointer].matrix);
			var inner2 = model[pointer].variation(inner1[0],inner1[1]);
			speed = model[pointer].speed;
			c = (c*Math.abs(1+speed)+ model[pointer].color*Math.abs(1-speed))/2;

			x=inner2[0];
			y=inner2[1];
			if(Math.abs(x)<1/(2*zoom)*N && Math.abs(y)<1/(2*zoom)*M && j>20) 
				plot( x, y ,c);			
		}
	}

	for(var i = 0; i < field.length; i++) {
		for (var j = 0; j < field[0].length; j++) {
			var coeff = Math.log10(1+ field[i][j].a)/field[i][j].a;
			field[i][j].r*=coeff;
			field[i][j].g*=coeff;
			field[i][j].b*=coeff;
			
        		if (field[i][j].r > 1)  field[i][j].r= 1;
	        	if (field[i][j].g > 1)  field[i][j].g= 1;
			if (field[i][j].b > 1)  field[i][j].b= 1;
		}
	}
}

core();
 
var image = new Jimp(N, M, function (err, image) {
	image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {	  
	   
		//var coord = Math.floor(Math.log(1+field[x][y])/max*255);
	    this.bitmap.data[ idx + 0 ] =	Math.floor(field[x][y].r*255);
	    this.bitmap.data[ idx + 1 ] = 	Math.floor(field[x][y].g*255);
	    this.bitmap.data[ idx + 2 ] = 	Math.floor(field[x][y].b*255);
	    this.bitmap.data[ idx + 3 ] = 255;
	  
	});
	image.write( process.argv[2] );
    
});




/*
var Jimp = require("jimp");
//console.log(Jimp);

function Create2DArray(rows,cols) {
  var arr = [];

  for (var i=0;i<rows;i++) {
     arr[i] = [];
     for (var j = 0; j < cols; j++) {
     	arr[i][j]=0;
     }
  }

  return arr;
}

function R(x,y) {
	return Math.sqrt(x*x + y*y);
}

function Theta(x,y) {
	return Math.atan2(y,x);
}

function julia_12(x,y) {
	var p3 = Math.trunc(Math.random()*12);
	var t = -(Theta(x,y) +2*Math.PI*p3)/12;
	var r =R(x,y);
	x=Math.pow(r,2/12)*Math.cos(t);
	y=Math.pow(r,2/12)*Math.sin(t);
	return [x,y];
}

function julia12(x,y) {
	var p3 = Math.trunc(Math.random()*12);
	var t = (Theta(x,y) +2*Math.PI*p3)/12;
	var r =R(x,y);
	x=Math.pow(r,-2.4/12)*Math.cos(t);
	y=Math.pow(r,-2.4/12)*Math.sin(t);
	return [x,y];
}

function transform(x,y, matrix) {
	var a=x*matrix[0][0]+matrix[0][1]*y+matrix[0][2];
	var b=x*matrix[1][0]+matrix[1][1]*y+matrix[1][2];
	return [a,b];
}

function id(x,y){
	return [x,y];
}

function maxM(matrix)
{
	var max =0;
	for(var i = 0; i < matrix.length; i++) {
		for (var j = 0; j < matrix[0].length; j++) {
			max = matrix[i][j]>max?matrix[i][j]:max;
		}
	}
	return max;
}

var field = Create2DArray(8001,8001);

var model = 
{
	count: 3,
	1: {
		matrix: [ [1,0,0.8],[0,1,0] ],
		variation: julia_12
	},
	0: {
		matrix: [ [2,0,0.8],[0,2,0] ],
		variation: julia12
	},
	2: {
		matrix: [ [0.74653,-0.200032,0],[0.200032,0.74653,0] ],
		variation: id
	}
}


var core = function()
{
	for (var i = 0; i < 80000; i++) {
		var x = 1- Math.random()*2;
		var y = 1-Math.random()*2;
		var pointer;
		var inner1 =[], inner2 =[];
		for (var j = 0; j < 8000; j++) {
			pointer = Math.trunc(1000*Math.random());
			if(pointer>=500) pointer = 2;
			else pointer = Math.trunc( pointer/250);
			var inner1 = transform(x,y, model[pointer].matrix);
			var inner2 = model[pointer].variation(inner1[0],inner1[1]);
			
			x=inner2[0];
			y=inner2[1];
			if(Math.abs(x)<1.25 && Math.abs(y)<1.25 && j>20) field[Math.round(4000+x*3200)][Math.round(4000+y*3200)]+=1;			
		}
	}
}
console.log(model[0].matrix);
core();
var max = Math.log(1+maxM(field))/255;
 
var image = new Jimp(8000, 8000, function (err, image) {
	image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {	  
	   
	    this.bitmap.data[ idx + 0 ] = Math.log(1+field[x][y])/max;
	    this.bitmap.data[ idx + 1 ] =  this.bitmap.data[ idx + 0 ]
	    this.bitmap.data[ idx + 2 ] =  this.bitmap.data[ idx + 0 ]
	    this.bitmap.data[ idx + 3 ] = 255;
	  
	});
	image.write( "path.png" );
    
});


*/
