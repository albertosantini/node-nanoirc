"use strict";

module.exports = function (grunt) {
    grunt.initConfig({
        eslint: {
            src: [
                "Gruntfile.js",
                "index.js",
                "lib/**/*.js"
            ]
        }

    });

    grunt.loadNpmTasks("grunt-eslint");

    grunt.registerTask("default", [
        "eslint"
    ]);
};
