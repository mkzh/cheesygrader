var fs = require('fs');
var mkdirp = require('mkdirp');

var express = require('express');
var multiparty = require('multiparty');
var http = require('http');
var path = require('path');

var grade = require('./modules/grader.js');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Add a favicon later
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Upload success callback function
var onSuccessfulUpload = function(paths) {
  // Debug Code
  // All files will be temporarily compared to this guy.
  // Read comparison to be added later
  var TEMPORARY_COMP = "solutions/myTestCase"

  // callback after grader comparison
  var callback = function(result) {
    if (result) {
      
    } else {
  
    }
  }

  console.log("Returning: " + paths);
  grade(paths, TEMPORARY_COMP, callback);
}

app.get('/', function(req, res) {
  res.render('index', {});
});

app.post('/uploadajax', function(req, res, next) {
  console.log("Received POST");
  console.log(req);
});

// Form submit
app.post('/upload', function(req, res, next) {
  var form = new multiparty.Form();
  var name;
  var uploaded = 0;
  var uploadedFiles = {};
  var validResponse = false;

  form.on('error', next);

  form.parse(req, function(err, fields, files) {
    console.log(fields);
    console.log(files);
    
    console.log("My name: " + fields.myname[0]);
    console.log("Code filename: " + files.codeupload[0].originalFilename);
    console.log("Output filename: " + files.outputupload[0].originalFilename);

    if ( (fields.myname[0] === '') || 
      (files.codeupload[0].originalFilename === '') ||
      (files.outputupload.originalFilename === '')) {
        console.log("Invalid Response");
        res.send("Invalid Response"); 
    }

    name = fields.myname[0];
  
    var today = new Date();
    var tmpCodePath = files.codeupload[0].path;
    var tmpOutputPath = files.outputupload[0].path
    var codeFileName = files.codeupload[0].originalFilename;
    var outputFileName = files.outputupload[0].originalFilename;
    
    // Get output paths: Based on current date/time to prevent duplicates
    // and clobbering
    var codeDir = './uploads/code/' + 
      today.getDate() + today.getMonth() + today.getFullYear() + '/' ;
    var outputDir = './uploads/output/' +
      today.getDate() + today.getMonth() + today.getFullYear() + '/';

    // Make the directories with impunity. TODO: add some checks to see
    // if the directories actually exist.
    mkdirp(outputDir, function(err) {
      if (err) console.error(err);
      writeOutput();
    });

    mkdirp(codeDir, function(err) {
      if (err) console.error(err);
      writeCode();
    });
   
    // Methods for writing code and output
    
  
    // Write the code to the given output directory
    var writeCode = function() {
      var code_target = codeDir + name + today.getTime() + codeFileName;

      fs.readFile(tmpCodePath, function(err, data) {
        fs.writeFile(code_target, data, function(err) {
          uploaded++;
          uploadedFiles.code = code_target;
          if (uploaded == 2) {
            onSuccessfulUpload(uploadedFiles);
          }
        });
      });
    };
  
    // write the output to the given output directory
    var writeOutput = function() {
      var output_target = outputDir + name + today.getTime() + outputFileName;

      fs.readFile(tmpOutputPath, function(err, data) {
        fs.writeFile(output_target, data, function(err) {
          uploaded++;
          uploadedFiles.output = output_target;
          if (uploaded == 2) { 
            onSuccessfulUpload(uploadedFiles);
          }
        });

      });
    };

  });
});

app.listen(8080);
