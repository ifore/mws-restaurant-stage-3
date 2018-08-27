const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const deploy = require('gulp-gh-pages');
const browserSync = require('browser-sync');
const clean = require('gulp-clean');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const minify = require('gulp-minify');
const pump = require('pump');


gulp.task('html', function() {
  return gulp.src(['index.html', 'restaurant.html']).pipe(gulp.dest('dist/'));
});

gulp.task('js', function() {
  return gulp.src(['js/**/*.js'])
        .pipe(minify({
  			   noSource: true,
  			   ext: {min: '.js'}
  		  }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/js/'))
        .pipe(
          browserSync.reload({
            stream: true
          })
        )
});

gulp.task('css', function() {
  return gulp.src('css/**/*')
    	.pipe(sass({
			outputStyle: 'compressed',
			indentType: 'tab',
			indentWidth: 1
		}).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/css/'))
        .pipe(
          browserSync.reload({
            stream: true
          })
        )
});


gulp.task('images', function() {
  return gulp.src(['img/**/*']).pipe(gulp.dest('dist/img/'));
});

gulp.task('favicon', function() {
  return gulp.src(['./favicon.ico']).pipe(gulp.dest('dist/'));
});

gulp.task('sw', function() {
  return gulp.src(['./sw.js']).pipe(gulp.dest('dist/'));
});

gulp.task('manifest', function() {
  return gulp.src(['./manifest.webmanifest']).pipe(gulp.dest('dist/'));
});


gulp.task('deploy', ['build'], function() {
  return gulp.src(['./dist/**/*']).pipe(deploy());
});

gulp.task('clean', function() {
  return gulp.src('dist', { read: false }).pipe(clean());
});

gulp.task('build', [
  'html',
  'js',
  'css',
  'images',
  'sw',
  'manifest',
  'favicon'
]);


gulp.task('serve', ['build'], function() {
  browserSync.init({
    server: {
      baseDir: 'dist/'
    },
    ui: {
      port: 5500
    },
    port: 5500
  });
});

gulp.task('dev', ['serve'], function() {
  gulp.watch('js/**/*.js', ['js']);
  gulp.watch('css/**/*.scss', ['scss']);
  gulp.watch(['index.html', 'restaurant.html'], ['html']);
});


gulp.task('default', ['dev']);
