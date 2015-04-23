var fs = require('fs');
var ejs = require('ejs');
var pluralize = require('pluralize');
var shuffle = require('knuth-shuffle').knuthShuffle;

var Flickr = require('flickrapi');

var flickrOptions = {
	api_key:"APIKEY GOES HERE"
	secret:"SECRET GOES HERE"
};
/*
 * GET home page.
 */

var dataStr = fs.readFileSync(__dirname + '/../blurbs', 'utf-8');
var wordStr =  fs.readFileSync(__dirname + '/../words', 'utf-8');
var dataArr = dataStr.split('\n');
var wordArr = wordStr.split('\n');

var imageMap = {};

var blurbs = dataArr.map(function(str) {
	return ejs.compile(str);
});

var flickr;

var fonts = [
'Condiment','Lobster','Cutive','Playball', 'Crete Round','Quicksand','Basic','Sniglet','Alex Brush','Merriweather','Pacifico','Kaushan Script'
];

Flickr.tokenOnly(flickrOptions, function(error, fo) {
  // we can now use "flickr" as our API object,
  // but we can only call public methods and access public data
  flickr = fo;
  console.log('ready');
});


function getImages(word, callback) {
	if(imageMap[word]) {
		
		return callback(imageMap[word]);
	} else {
		
		flickr.photos.search({
			text: word,
			page: 1,
			sort: 'relevance',
			extras:'url_l,owner_name',
			per_page: 15,
			license: '1,2,4,5,7,8'
		}, function(err, result) {
			var outPhotos = [];
			if(err) {
				return callback(false);
			}
			var photoUrl = false;
			if(result.photos && result.photos.photo) {
				result.photos.photo.forEach(function(photo) {
					if(photo.url_l) {
						
						outPhotos.push(photo);
					}
				});
				callback(outPhotos);
				
				imageMap[word] = outPhotos;
			} else {
				callback(false);
			}
		});
	}
}

exports.index = function (req, res) {
	
	res.render('splash');

};

exports.generate = function (req, res) {
	var word = wordArr[(Math.round(Math.random() * (wordArr.length-1)))].toLowerCase();
	res.redirect('/' + word + 'io');
};

exports.startup = function(req, res){


	//we need random blurbs
	var shuffledBlurbs = shuffle(blurbs.slice(0)),
	word,
	myBlurbs = [];
	
	var trimmedWord = req.params.word ? req.params.word.replace(/io/, '') : false;
	
	
	if(trimmedWord && wordArr.indexOf(trimmedWord) !== -1) {
		word = trimmedWord;
		console.log('found word');
	} else if (req.params.word.match(/</)) {
		word = 'XSS vulnerability';
	} else if (req.params.word.match(/\-\-/)) {
		word = 'SQL injection';
	} else {
		word = wordArr[(Math.round(Math.random() * (wordArr.length-1)))].toLowerCase();
	}



	

	getImages(word, function(result) {
		var photos = result;

		var out = {
			title: pluralize(word),
			singular: word,
			photos: photos,
			font: fonts[(Math.round(Math.random() * (fonts.length-1)))],
			name : word[0].toUpperCase() + word.slice(1) + 'io'
		}
		
		for (var i = 0; i < 6; i++) {
			myBlurbs.push(shuffledBlurbs[i](out));
		};

		out.blurbs = myBlurbs;
	  	res.render('index', out);
	});

};