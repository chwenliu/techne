var gulp = require('gulp');

var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var watch = require('gulp-watch');
var gulpkss = require('gulp-kss');
var concat = require('gulp-concat');
var insert = require('gulp-insert');
var config = require('./config.json');
var iconfont = require('gulp-iconfont');
var consolidate = require('gulp-consolidate');
var LessPluginCleanCSS = require('less-plugin-clean-css'),
    cleancss = new LessPluginCleanCSS({ advanced: true });


var connect = require('gulp-connect-multi')();


var paths = {
  scripts: 'src/js/**/*',
  less: ['src/less/**/*.less','!src/less/**/_*.less'],
  less_watch: 'src/less/**/*.less',
  doc_less: 'src/less/**/*.less',
  doc_markdown: 'docs/markdown/**/*',
  doc_template: 'docs/template/**/*',
  html: ['src/html/**/*.html'],
  environment: 'dist'
};



// Complile general Less Files
gulp.task('less', function () {
    return gulp.src(paths.less)
        .pipe(less({errLogToConsole: true, plugins: [cleancss]}))
        .on('error', function(err){ console.log(err.message); })
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
          }))
        .pipe(concat('techne.min.css'))
        .pipe(connect.reload())
        .pipe(gulp.dest(paths.environment+'/css/'));
});


// Create Iconfont
gulp.task('iconfont', function(){
  gulp.src(['src/icons/*.svg'])
    .pipe(iconfont({
      fontName: 'hyicon',
      normalize: true,
      centerHorizontally: true,
      fontHeight: 100 // IMPORTANT
    }))
    .on('codepoints', function(codepoints, options) {
      gulp.src('src/less/templates/_icons.less')
        .pipe(consolidate('lodash', {
          glyphs: codepoints,
          fontName: 'hyicon',
          fontPath: '../fonts/',
          className: 'hyicon'
        }))
        .pipe(gulp.dest('src/less/components'));
    })
    .pipe(gulp.dest('dist/fonts/'));
});

// Complile general Less Files
gulp.task('html', function () {
    return gulp.src(paths.html)
      .pipe(gulp.dest('docs/'))
      .pipe(connect.reload());
});


// Generate Docs
gulp.task('styleguide', function () {


    gulp.src(paths.doc_less)
    .pipe(gulpkss({
//        overview: __dirname + '/docs/markdown/index.md',
        markDownDirectory: __dirname + '/docs/markdown/',
        templateDirectory: __dirname + '/docs/template'
    }))
    .pipe(gulp.dest('docs/kss'));

    gulp.src(paths.less)
    .pipe(less())
    .pipe(concat('techne.css'))
    .pipe(gulp.dest('docs/kss/public/css/'));

    gulp.src('./dist/fonts/**/*')
   .pipe(gulp.dest('./docs/kss/public/fonts'));

    gulp.src('./bower_components/bootstrap/fonts/**/*')
   .pipe(gulp.dest('./docs/kss/public/fonts'));


});


gulp.task('connect', connect.server({
  root: [__dirname],
  port: 1341,
  livereload: true,
  open: {
    browser: 'none' // if not working OS X browser: 'Google Chrome'
  }
}));

gulp.task('deploy', function(){
    
    
    /*
    JS
     */
    gulp.src(
        [
//            './bower_components/webcomponentsjs/webcomponents.js',
            './bower_components/jquery/dist/jquery.min.js',
            './bower_components/bootstrap/dist/js/bootstrap.min.js', 
            './bower_components/select2/select2.js'
        ]
    )
    .pipe(concat('techne.js'))
        
    .pipe(insert.append(function(){
        var headTagAppendScript = ['\n'];

        
        if(config.appendComponentLess || config.appendComponentHTML)
        {
            headTagAppendScript.push(";(function() {");
                headTagAppendScript.push("var headTag = document.getElementsByTagName('head')[0];");
                if(config.appendComponentLess)
                {
                    headTagAppendScript.push("var css = document.createElement('link');");
                    headTagAppendScript.push("css.rel = 'stylesheet';");
                    headTagAppendScript.push("css.href = '"+ config.bower_path +"/hyTechne/dist/css/techne.min.css';");
                    headTagAppendScript.push("headTag.appendChild(css);");
                }

                if(config.appendComponentHTML) {
                    headTagAppendScript.push("var html = document.createElement('link');");
                    headTagAppendScript.push("html.rel = 'import';");
                    headTagAppendScript.push("html.href = '" + config.bower_path + "/hyTechne/dist/html/techne.html';");
                    headTagAppendScript.push("headTag.appendChild(html);");
                }

            headTagAppendScript.push("})();");
        }
        return headTagAppendScript.join('\n');
    }))
    .pipe(gulp.dest(paths.environment+'/js/'));
    
    /*
    HTML
     */


    gulp.src(paths.html)
    .pipe(concat('techne.html'))
    .pipe(insert.prepend(function(){
        var componentHTML = [];
        componentHTML.push( "<link rel='import' href='../../../apply-author-styles/apply-author-styles.html'>\n" );

        return componentHTML.join('\n');
    }))
    .pipe(gulp.dest(paths.environment+'/html/'))
    
    
    

});

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(paths.less_watch, ['less']);
  //gulp.watch(paths.css, ['css']);
    gulp.watch(paths.html, ['html']);
    gulp.watch(paths.doc_template, ['styleguide']);
    gulp.watch(paths.less_watch, ['styleguide']);
});


// The default task (called when you run `gulp` from cli)
gulp.task('default', [ 'less' , 'connect', 'watch', 'styleguide']);
