module.exports = function(grunt) {
    grunt.initConfig({
        dapper: {
            dist: {
                src: "example/assets/",
                dest: "example/public/",
                minify: true
            }
        },
        jshint: {
            all: {
                files: {
                    src: ['Grunfile.js', 'tasks/**/*.js']
                },
                options: {
                    globals: {
                        'require': false,
                        'module': true
                    }
                }
            }
        }
    });
    
    /**
     * Example tasks
     */
    grunt.registerTask('build', ['dapper']);
    grunt.registerTask('quick', function() {
        grunt.config.set('dapper.dist.minify', false);
        grunt.task.run('dapper');
    });
    
    /**
     * Ignore below here
     */    
    grunt.loadTasks('tasks');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    
    grunt.registerTask('build-client', function() {
        var uglify = require('uglify-js'),
            template = "module.exports = function() {\n    return '<%= min %>';\n};";
            src = grunt.file.read('tasks/data/dapper.js'),
            min = uglify.minify(src, {fromString: true});
            out = grunt.template.process(template, {data: {min: min.code}}),
            
        grunt.file.write('tasks/data/client.js', out);
    });
    
    grunt.registerTask('test', ['jshint']);
};