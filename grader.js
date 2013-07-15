#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var HTMLURL_DEFAULT="http://evening-springs-9625.herokuapp.com/"

var exitWithMessage = function(fn) {
    fn();
    process.exit(1);
    return null;
}

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	exitWithMessage(function(){console.log("%s does not exist. Exiting.", instr);});
        // console.log("%s does not exist. Exiting.", instr);
        // process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var checkHtmlBuffer = function(buffer, checksfile) {
    // buffer = new Buffer(fs.readFileSync(file), 'utf-8');
    // $ = cheerioHtmlFile(htmlfile);
    if (buffer) {
        $ = cheerio.load(buffer.toString());
        var checks = loadChecks(checksfile).sort();
        var out = {};
        for(var ii in checks) {
            var present = $(checks[ii]).length > 0;
            out[checks[ii]] = present;
        }
	return out;
    }
}

var loadFile = function(file, buffer) {
    if (file) {
	buffer = new Buffer(fs.readFileSync(file), 'utf-8');
	// buffer = fs.readFileSync();
    }
};

var loadUrl = function() {
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var buildfn = function(callback, checks) {
    var response2buffer = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
	    checkJson = callback(new Buffer(result, 'utf-8'), checks);
            // console.error("Wrote %s", csvfile);
            // fs.writeFileSync(csvfile, result);
            // csv2console(csvfile, headers);
	    outJson = JSON.stringify(checkJson, null, 4);
	    console.log(outJson);
        }
    };
    return response2buffer;
};


var loadHtml = function(file, url, callback, checks) {
//    console.log('file : %j', file);
//    console.log('url  : %j', url);
    if (url) {
//	console.log('Using url');
	rest.get(url).on('complete', buildfn(callback, checks));
    } else if (file) {
// 	console.log('Using file');
	checkJson = callback(new Buffer(fs.readFileSync(file), 'utf-8'), checks);
	outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    } else {
	console.log('file or url has to be provided!');
    }
}

if(require.main == module) {
    var buffer;
    program
//         .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists))
        .option('-f, --file <html_file>', 'Path to index.html', null)
	.option('-u, --url <html_url>', 'URL to html file', null)
        .parse(process.argv);
    // var checkJson = checkHtmlBuffer(buffer, program.checks);
    // var buffer = 
    loadHtml(program.file, program.url, checkHtmlBuffer, program.checks);
    // if (buffer && buffer.length > 0) {
//	console.log('buffer lenght: %j',  buffer.length);
    // } else {
    //    console.log('buffer empty');
    // }
//    var checkJson = checkHtmlBuffer(buffer, program.checks);
//    var outJson = JSON.stringify(checkJson, null, 4);
//    console.log(outJson);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}

