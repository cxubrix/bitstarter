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

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
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

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var buildfn = function(callback) {
    var response2buffer = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
	    callback(new Buffer(result, 'utf-8'));
        }
    };
    return response2buffer;
};


var loadHtml = function(file, url, callback) {
    if (url) {
	rest.get(url).on('complete', buildfn(callback));
    } else if (file) {
	callback(new Buffer(fs.readFileSync(file), 'utf-8'));
    } else {
	console.log('file or url has to be provided!');
    }
}

var gen = function(param) {
    var rez = function(buffer) {
	return checkHtmlBuffer(buffer, param);
    }
    return rez;
};

if(require.main == module) {
    
    // parse command line input into program variables
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', null)
	.option('-u, --url <html_url>', 'URL to html file', null)
        .parse(process.argv);

    // callback which checks buffer against checks file and prints it out
    var callback = function(buffer) {
	checkJson = checkHtmlBuffer(buffer, program.checks);
	outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    };

    // load url or file in buffer anc invoke callback
    loadHtml(program.file, program.url, callback);

} else {
    exports.checkHtmlFile = checkHtmlFile;
}

