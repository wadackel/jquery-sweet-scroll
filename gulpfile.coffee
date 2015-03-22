# require modules & config
gulp = require "gulp"
$    = do require "gulp-load-plugins"
pkg  = require "./package.json"


# variables
banner = [
  "/*!"
  " * <%= pkg.name %>"
  " * <%= pkg.description %>"
  " * @version <%= pkg.version %>"
  " * @author <%= pkg.author %>"
  " * @license <%= pkg.license %>"
  " */"
].join "\n"


# paths
paths = {}
paths.src = "./src"
paths.dist = "./"


# jshint
gulp.task "jshint", ->
  gulp.src paths.src + "/*.js"
  .pipe $.plumber()
  .pipe $.jshint pkg.jshintConfig
  .pipe $.jshint.reporter "default"


# js
gulp.task "js", ->
  gulp.src paths.src + "/*.js"
  .pipe $.plumber()
  .pipe $.header banner, {pkg: pkg}
  .pipe gulp.dest paths.dist
  .pipe $.uglify {preserveComments: "some"}
  .pipe $.rename {extname: ".min.js"}
  .pipe gulp.dest paths.dist


# watch
gulp.task "watch", ["js"], ->
  gulp.watch paths.src + "/*.js", ["js", "jshint"]


# default
gulp.task "default", ->
  gulp.run "watch"


# build
gulp.task "build", ["jshint"], ->
  gulp.run "js"

