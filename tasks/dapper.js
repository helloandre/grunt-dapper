/*
 * Dapper Grunt Plugin
 *    - a plugin for concatinating css and js
 *    - including using dapper.js for dependency management
 * 
 *
 * Copyright (c) 2013 Andre Bluehs
 * Licensed under the MIT license.
 */
 
/*jshint globalstrict: true*/
"use strict";

module.exports = function(grunt) {
    
    
    grunt.registerMultiTask('dapper', 'Dapper Compiling and Dependency Management', function() {
        var require_regex = new RegExp('@@require ([0-9a-zA-Z./_-]+)', 'g'),
            dependencies = {},
            src = this.data.src,
            dest = this.data.dest,
            // should we compress the sources too?
            minify = this.data.minify,
            fetcher = require('./lib/fetcher'),
            // let fetcher go and tell us which files to do things with
            files = fetcher.fetch(this.data.src);
            
        if (minify === undefined) {
            minify = true;
        }
            
        if (src === undefined) {
            throw new Error("src not declared");
        }
        if (dest === undefined) {
            throw new Error("dest not declared");
        }
            
        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            done_template: '\n\nDapper.done("<%= filename %>");',
            normal_template: {
                prefix: '\n\n// <%= filename %>\n(function(){\n\n',
                suffix: '\n})();'
            },
            when_template: {
                prefix: '\n\n// <%= filename %>\nDapper.when([<%= files %>], function() {\n',
                suffix: '\n});'
            }
        });
            
        var fullsrcpath = function(filename, filetype) {
            return src + filetype + '/' + filename + '.' + filetype;
        };
        
        var fulldestpath = function(filename, filetype, minify) {
            var minpost = minify || false ? '.min' : '';
            return dest + filetype + '/' + filename + minpost + '.' + filetype;
        };
        
        files.forEach(function(list_obj) {
            // the concatenated files
            // this is what is minified eventually
            var output = '';
            
            list_obj.files
                // see if they actually exist
                .filter(function(filename) {
                    // Warn on and remove invalid source files (if nonull was set).
                    if (!grunt.file.exists(fullsrcpath(filename, list_obj.filetype))) {
                        grunt.log.warn('Source file "' + fullsrcpath(filename, list_obj.filetype) + '" not found.');
                        return false;
                    } else {
                        return true;
                    }
                    
                })
                // read the file, add any dapper wrappers necessary, concat
                .map(function(filename) {
                    // Read file source.
                    var src = grunt.file.read(fullsrcpath(filename, list_obj.filetype));
                    
                    // we only add our wrapper + announce for .js files
                    if (list_obj.filetype == 'js') {
                        // find any file-level dependencies
                        var match = null,
                            matches = [],
                            template = options.normal_template,
                            template_data = {
                                data: {
                                    filename: filename
                                }
                            };
                            
                        // set an empty object in dependency graph
                        dependencies[filename] = {};
                        
                        // find any @@require'd dependencies 
                        do {
                            match = require_regex.exec(src);
                            if (match) {
                                if (dependencies[match[1]] && dependencies[match[1]][filename]) {
                                    throw new Error('Circular Dependency Detected');
                                }
                                
                                // remove trailing .js if necessary
                                if (match[1].substr(-3) == '.js') {
                                    match[1] = match[1].substr(0, match[1].length -3);
                                }
                            
                                matches.push(match[1]);
                                dependencies[filename][match[1]] = true;
                            }
                        } while (match !== null);
                        
                        
                        // add required files to template data
                        // update template to use
                        if (matches.length) {
                            template_data.data.files = '"' + matches.join('", "') + '"';
                            template = options.when_template;
                        }
                        
                        // prepend the template
                        src = grunt.template.process(template.prefix, template_data) + src;
                        
                        // add our dapper announcement
                        src += grunt.template.process(options.done_template, template_data);
                        
                        // add suffix *after* dapper announcement
                        src += grunt.template.process(template.suffix);
                    }
                    
                    output += src;
                });

            var fulldestmin = fulldestpath(list_obj.dest, list_obj.filetype, true);
            var fulldest = fulldestpath(list_obj.dest, list_obj.filetype);

            // apply compression, but only if we expliclty say not to
            // on this particular rollup
            // this allows pre-compiled libraries (my usecase was tinymce)
            // that are quite large that you don't need to recompile frequently
            if (minify && !list_obj.never_minify) {
                switch (list_obj.filetype) {
                    case 'js':
                        var uglify = require('uglify-js'),
                            ugmin = uglify.minify(output, {fromString: true});
                        grunt.file.write(fulldestmin, ugmin.code);
                        break;
                    case 'css':
                        var cssmin = require('cssmin');
                        grunt.file.write(fulldestmin, cssmin(output));
                        break;
                }
            }

            // write unminified
            grunt.file.write(fulldest, output);

            // Print a success message.
            grunt.log.writeln('File "' + fulldest + '" processed.');
        });

        // now a special case to insert our dapper code into 
        // the destination directory so that it is requestable
        var dc = require('./data/client');
        grunt.file.write(this.data.dest + 'js/dapper.min.js', dc());
    });
};
