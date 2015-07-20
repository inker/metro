var gulp = require('gulp');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var babelify = require('babelify');
var fs = require('fs');
var util = require('gulp-util');
var buffer = require('vinyl-buffer');
var es         = require('event-stream');
var literalify = require('literalify');

gulp.task('default', ['server-transpile-merge-compress', 'client-transpile-merge-compress', 'watch']);

gulp.task('watch', function () {
    //gulp.start('merge-transpile-compress');
    var patterns = ['./js/*.js', './util.js', '!./js/script.js'];
    gulp.watch(patterns, ['client-transpile-merge-compress']);
    //gulp.watch(['./*.js', './*/*.js', '!./public/js/*.js', '!./server.js'], ['server-transpile-merge-compress']);
});

gulp.task('server-transpile-merge-compress', function() {
    browserify('./bin/www')
        .transform(babelify)
        .bundle()
        .pipe(fs.createWriteStream('./server.js'));
});

//gulp.task('merge', function () {
//    //
//    return browserify('./public/js/main.js')
//        .transform(babelify)
//        .bundle()
//        //.pipe(source('bundle.js'))
//        //.pipe(gulp.dest('./public/js/'));
//        .pipe(fs.createWriteStream("./public/js/bundle.js"));
//});
//
//// browserify must be completed before uglify
//gulp.task('compress', ['merge'], function () {
//    return gulp.src('./public/js/bundle.js')
//        .pipe(uglify())
//        .pipe(gulp.dest('./public/js/'));
//});

gulp.task('client-transpile-merge-compress', function() {
    var b = browserify()
        //.external(['leaflet'])
        // add the main file (could be in browserify as a parameter)
        .add('./js/main.js')
        // transform by babel
        .transform(babelify)
        // make the bundler believe the <script>'d leaflet is a module without bundling it
        .transform(literalify.configure({
            // map module names with global objects
            'leaflet': 'window.L'
        }))
        //.on('prebundle', function(bundle) {
        //    bundle.external('leaflet');
        //})
        // build it
        .bundle()
        // writes to bundle.js
        .pipe(source('script.js'))
        //.pipe(buffer())
        //// compress it
        //.pipe(uglify())
        // copy to destination
        .pipe(gulp.dest('./js/'));
    //es.merge(null, [gulp.src('./public/js/leaflet.js'), b]).pipe(gulp.dest('./public/js/'));
});

//gulp.task('build-vendor', function() {
//    browserify({
//        // generate source maps in non-production environment
//        debug: true,
//        external: ['leaflet']
//    }).bundle().pipe(source('app.js')).pipe(gulp.dest('./public/js'));
//});
//
//gulp.task('browserify-lib', function(){
//    // create a browserify bundle
//    var b = browserify()
//        .require('leaflet')
//        .bundle()
//        .pipe(source('leaflet.js'))   // the output file is react.js
//        .pipe(gulp.dest('./public/js')); // and is put into dist folder
//});

var symlink = require('gulp-symlink');

gulp.task('symlink', function () {
    return gulp.src('public/index.html')
        .pipe(symlink('foo')) // Write to the destination folder
        .pipe(symlink('foo/index.html')) // Write a renamed symlink to the destination folder
});