'use strict';
const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const uglify = require('gulp-uglify');
const babelify = require('babelify');
const fs = require('fs');
const util = require('gulp-util');
const buffer = require('vinyl-buffer');
//const es         = require('event-stream');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');
const tsify = require('tsify');
const notify = require("gulp-notify");

const workflow = {
    // for webstorm with built-in typescript compiler enabled
    'webstorm': ['js-es5-merge-compress', 'watch-js'],
    // for other text editors
    'other': ['ts-transpile-merge-compress', 'watch-ts-for-all-way'],
    // naive watchers
    'naive': ['bundle-after-ts', 'watch-ts']
};

gulp.task('default', workflow['other']);

gulp.task('watch-ts', () => {
    gulp.watch(['src/*.ts', '!src/*.js'], ['bundle-after-ts']);
});

const tsProject = ts.createProject('tsconfig.json');
gulp.task('compile-typescript', () => {
    console.log('compiling typescript');
    return gulp.src('src/*.ts', { base: "./" }).pipe(ts({
        //"target": "es6",
        "target": "es5",
        "module": "commonjs",
        "sourceMap": true,
        "watch": true,
        //"experimentalDecorators": true,
        //"experimentalAsyncFunctions": true,
        "noLib": true,
        "isolatedModules": true
    })).js.pipe(gulp.dest('.'));
    // const tsResult = tsProject.src() // instead of gulp.src(...) 
    //     .pipe(ts(tsProject));
    
    // return tsResult.js.pipe(gulp.dest('.'));
});

gulp.task('bundle-after-ts', ['compile-typescript'], () => {
    return browserify()

        //.transform(babelify, {presets: ["es2015"]})
                .add('./src/main.js')
        .bundle()
        .pipe(source('script.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest('./js/'))
        .pipe(notify("Bundling complete!"));
       ;    
});

gulp.task('watch-js', () => {
    const patterns = ['./src/*.js', './util.js'];
    gulp.watch(['./src/main.js'], ['js-es5-merge-compress']);
    //gulp.watch(['./*.js', './*/*.js', '!./public/js/*.js', '!./server.js'], ['server-transpile-merge-compress']);
});

gulp.task('watch-ts-for-all-way', () => {
    gulp.watch(['src/*.ts', 'src/*/*.ts', '!src/routeworker.ts'], ['ts-transpile-merge-compress']);
    gulp.watch(['src/routeworker.ts'], ['webworker-merge-compress']);
});

gulp.task('ts-transpile-merge-compress', () => {
    browserify()
        .add('typings/tsd.d.ts')
         .add('src/main.ts')
        .plugin(tsify, {target: 'es5', module: 'commonjs', noLib: true})

         //.transform(babelify, {presets: ["es2015"], extensions: ['.js', '.json']})
         //.add('src/main.js')
         .bundle()
         .on('error', error => console.error(error.toString()))
         .pipe(source('script.js'))
        //   .pipe(buffer())
        //   .pipe(uglify())
        //// uglifyjs -m -c --screw-ie8 -o js/script.js -- js/script.js
         .pipe(gulp.dest('./js/'))
         .pipe(notify("Bundling complete!"))
         ;
});

gulp.task('webworker-merge-compress', () => {
    browserify()
        .add('typings/tsd.d.ts')
        .add('src/routeworker.ts')
        .plugin(tsify, {target: 'es5', module: 'commonjs', noLib: true})
        .bundle()
        .on('error', error => console.error(error.toString()))
        .pipe(source('routeworker.js'))
        .pipe(gulp.dest('./js/'))
        .pipe(notify("Bundling complete!"))
    ;
});

gulp.task('js-es5-merge-compress', () => {
    return browserify()
        // add the main file (could be in browserify as a parameter)
        // transform by babel
        .transform(babelify, {presets: ["es2015"]})
        .add('./src/main.js')
        // make the bundler believe the <script>'d leaflet is a module without bundling it
        //.transform(literalify.configure({
        //    // map module names with global objects
        //    'leaflet': 'window.L'
        //}))
        // build it
        .bundle()
        .on('error', error => console.error(error.toString()))
        // writes to bundle.js
        .pipe(source('script.js'))
        .pipe(buffer())
        //.pipe(sourcemaps.init())
        // compress it
        .pipe(uglify())
        //.pipe(sourcemaps.write())
        //.on('error', err => console.error(err))
        // copy to destination
        .pipe(gulp.dest('./js/'))
        //.pipe(notify("Bundling complete!"));
       ;
    //es.merge(null, [gulp.src('./public/js/leaflet.js'), b]).pipe(gulp.dest('./public/js/'));
});

gulp.task('compress', () => gulp.src('js/script.js')
    .pipe(uglify())
    .pipe(gulp.dest('js/'))
    .pipe('compressed'));