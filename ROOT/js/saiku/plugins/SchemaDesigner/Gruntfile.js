module.exports = function(grunt) {
	grunt.initConfig({

		// Lint definitions
		jshint: {
			files: ['plugin.js'],
			options: {
				jshintrc: '.jshintrc'
			}
		},

		// CSS Comb definitions
		csscomb: {
			dist: {
				options: {
					config: '.csscomb.json'
				},
				files: {
					// 'css/plugin.css': ['css/plugin.css']
				}
			}
		}
	});

	// These plugins provide necessary tasks
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-csscomb');

	// By default, lint and run all tests
	grunt.registerTask('default', ['jshint']);
	grunt.registerTask('lint', ['jshint']);
	grunt.registerTask('comb', ['csscomb']);
};