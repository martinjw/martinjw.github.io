module.exports = function (grunt) {
    'use strict';

	grunt.initConfig({
		uglify: {
		  js: {
			files: {
			  'utilities.js': ['utilities.max.js']
			}
		  }
		},
		
		cssmin: {
		  css: {
			files: {
				'style.css': ['style.max.css']
			}
		  }
		},

	});
	
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	
	grunt.registerTask('default', ['uglify', 'cssmin']);
};