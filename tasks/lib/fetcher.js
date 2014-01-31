/** 
 * Fetches, parses, builds objects of list files
 *
 * @module Fetcher 
 * @exports Fetcher
 * @version 0.1.0
 */
 
/*jshint globalstrict: true*/
'use strict';

function Fetcher() {
    // set by fetch()
    this.srcpath = '';
    
    // where lists are stored
    this.rolluppath = 'rollup/';
    
    // where can we find those meddling kids
    this.rollupglob = "**/*.json";
    
    // globbing up your filesystem
    this.glob = require('glob');
    
    // filesysteming up your filesystem
    this.fs = require('fs');
    
    // this makes readFileSync play nicely
    this.fs_options = {
        encoding: 'utf8'
    };
    
    // where the wild things are
    this.output = [];
}

/**
 * Trumpet Sounds
 *
 * @param {String} srcpath
 */
Fetcher.prototype.fetch = function(srcpath) {
    
    this.srcpath = srcpath;
    
    // recurse through all the public list files
    // and build ourselves some sweet, sweet outputs
    this.glob.sync(this.srcpath + this.rolluppath + this.rollupglob).forEach(this._build.bind(this));
    
    return this.output;
};

/**
 * The one guy at the construction site actually doing anything
 *
 * @param {String} filename
 */
Fetcher.prototype._build = function(filename) {
    var data = JSON.parse(this.fs.readFileSync(filename, this.fs_options)),
        filepath_arr = filename.replace(this.srcpath + this.rolluppath, '').split('/'),
        filetype = filepath_arr.shift(),
        filepath = filepath_arr.join('/').replace('.json', '');
        
    this.output.push({
        dest: filepath,
        filetype: filetype,
        files: data.files
    });
};

module.exports = new Fetcher();
