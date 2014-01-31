# Dapper

Dapper is an asset compression and dependency management tool. It allows you to declare "lists" of assets that can be combined, and minified to reduce the number of HTTP requests your app has to make. Then when they are loaded dependencies are resolved.

The reason it does both compression and dependencies is because it automatically writes code to manage dependencies. This was born out of a need to retrofit compression and dependency management into an existing project. When you start compressing things into files, order of inclusion in the compressed file becomes extremely important... unless you have dependency management take care of that for you.

Dapper works well for getting your project from including multiple script/style files on a page to a much smaller number of files very quickly. It was born out of a need to retrofit a project to do just that.

## Install

    npm install grunt-dapper
   
## Usage

Dapper has 3 parts: 

 1. grunt config
 1. rollups
 1. your js files


### 1. Grunt

An example Grunt config:

    grunt.initConfig({
        dapper: {
            dist: {
                src: "example/assets/",
                dest: "example/public/",
                minify: true
            }
        }
    });

    grunt.loadNpmTask('grunt-dapper');
    
    /**
     * Example tasks
     */
    grunt.registerTask('build', ['dapper']);
    grunt.registerTask('quick', function() {
        grunt.config.set('dapper.dist.minify', false);
        grunt.task.run('dapper');
    });

### Options

#### src (required)

Type: `string`
Default: `null`

the location of the three directories: `css/`, `js/` and `rollup/`

#### dest (required)

Type: `string`
Default: `null`

where you would like the output sent. directory structure from the `rollup/` directory is preserved.

#### minify

Type: `boolean`
Default: `true`

wether or not to run `cssmin` or `uglify-js` on the output.

### 2. Rollups

A json list of files you want included in a similarly named css or js file. See `example/assets/rollup/` directory. A rollup will look like this:

    {
        "files": [
            "index/index",
            "lib/somelib"
        ]
    }

The name and location of the output file is determined by the name and location of the rollup file relative to the `dest` option in the grunt config.

The type of output is determined by what directory inside `rollup/` it's in. Either `rollup/js/` or `rollup/css/`. You do not need to include the filetype in the list.

### 2. Javascript Dependencies (your js files)

All you need to do to your existing javascript files is add lines at the top declaring which other js files it depends on.

Say you have a file at `js/index/index.js` that uses bits from two other libraries located in other files. The top of `js/index/index.js` would look like this:

    // @@require js/lib/mylib
    // @@require js/common/otherlib

    var Index = function() {
    ...

`js/index/index.js` would then wait until the other two libs have been loaded until it ran. This allows arbitrary listing in rollups without you having to worry about what order everything is included on the page.
 