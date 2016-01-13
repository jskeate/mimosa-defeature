"use strict";

var path = require( 'path' ),
    util = require('util'),
    _ = require('lodash'),
    logger = null;
var regexDefeatureUtils = require('./regex_defeature_utils');

var _defeature = function( mimosaConfig, options, next ) {
  if ( !options.isVendor && options.files && options.files.length ) {
    var keepFiles = [];
    options.files.forEach( function( file ) {
      var source = file.inputFileText;
      var opts = {
        source:           source,
        includedFeatures: mimosaConfig.defeature.includedFeatures,
        excludedFeatures: mimosaConfig.defeature.excludedFeatures,
        startCommentText: "/\\*",
        endCommentText:   "\\*/",
        logger:           logger
      };
      var keep = true;
      var finalSource = "";
      var start = 0;
      var rangesToRemove = regexDefeatureUtils.mergeOverlappingRanges(regexDefeatureUtils.getRangesToRemove(opts));
      if(rangesToRemove.length > 0) {
        rangesToRemove.forEach(function(range) {
          finalSource += source.slice(start, range[0]);
          var commentedSource = source.slice(range[0], range[1]);
          finalSource += commentedSource.split('\n').map(function(line) {
            if (line !== "") return "//" + line;
            return line;
          }).join('\n');
          start = range[1];
        });
        finalSource += source.slice(start, source.length);
        file.inputFileText = finalSource;
        // keepFiles array exists, and the file has content
        // add file to keepFiles.  This leaves out any files
        // that have length = 0.
        if(keepFiles && finalSource.length && finalSource.length > 0) {
          keepFiles.push(file);
        }
      } else {
        keepFiles.push(file);
      }
      // only keeping files that need to be written
      if (keep) {
        keepFiles.push(file);
      }
    });
    options.files = keepFiles;
  }
  next();
};

exports.registration = function( mimosaConfig, register ) {
  logger = mimosaConfig.log;
  var exts = mimosaConfig.extensions.javascript;
  register(
    ['add', 'update', 'remove', 'buildFile'],
    'afterRead',
    _defeature,
    exts
  );
};
