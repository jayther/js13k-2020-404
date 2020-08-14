'use strict';

const path = require('path'),
  { src, dest, series, parallel } = require('gulp'),
  fs = require('fs-extra'),
  mustache = require('gulp-mustache'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  sass = require('gulp-sass'),
  zip = require('gulp-zip'),
  size = require('gulp-size'),
  micro = require('gulp-micro'),
  htmlmin = require('gulp-htmlmin'),
  express = require('express'),
  del = require('del');

const appBuildPath = './app.build.json';

let appBuild = null;

  
function renderTemplate(templateSettings, valuesObj) {
  var combinedObj = Object.assign({}, valuesObj, templateSettings.extraSettings);
  var stream = src(templateSettings.from)
    .pipe(mustache(combinedObj))
    .pipe(rename(path.basename(templateSettings.to)))
    .pipe(dest(path.dirname(templateSettings.to)));
  console.log('rendering ' + templateSettings.to);
  return stream;
}

function getAppBuild() {
  return fs.readJsonSync(appBuildPath);
}

function reloadSettings() {
  appBuild = getAppBuild();
}

reloadSettings();

function concatJs() {
  return src(appBuild.concat.js.files)
    .pipe(concat(path.basename(appBuild.concat.js.output)))
    .pipe(dest(path.dirname(appBuild.concat.js.output)));
}

function wrapJs() {
  const content = fs.readFileSync(appBuild.wrap.from, 'utf8');
  return src(appBuild.wrap.wrapper)
    .pipe(mustache({ content: content, gameSettings: JSON.stringify(appBuild.game) }))
    .pipe(rename(path.basename(appBuild.wrap.to)))
    .pipe(dest(path.dirname(appBuild.wrap.to)));
}

function minifyJs() {
  return src(appBuild.minify.js.from)
    .pipe(uglify(appBuild.minify.js.options))
    .pipe(rename(path.basename(appBuild.minify.js.to)))
    .pipe(dest(path.dirname(appBuild.minify.js.to)));
}

function sassCss() {
  return src(appBuild.sass.from)
    .pipe(sass(appBuild.sass.options))
    .pipe(rename(path.basename(appBuild.sass.to)))
    .pipe(dest(path.dirname(appBuild.sass.to)));
}

function renderHtmlDev() {
  return renderTemplate(appBuild.templates.indexHtmlDev, appBuild);
}

function renderHtml() {
  return renderTemplate(appBuild.templates.indexHtml, appBuild);
}

function minifyHtml() {
  return src(appBuild.minify.html.from)
    .pipe(htmlmin(appBuild.minify.html.options))
    .pipe(rename(path.basename(appBuild.minify.html.to)))
    .pipe(dest(path.dirname(appBuild.minify.html.to)));
}

function staticExport() {
  del.sync('build');
  const promises = [];
  appBuild.export.files.forEach((file) => {
    promises.push(new Promise((resolve, reject) => {
      src(file.from)
        .pipe(dest(path.join(appBuild.export.path, file.to)))
        .on('end', resolve);
    }));
  });
  return Promise.all(promises);
}

function localServer(cb) {
  const app = express();
  
  app.use('/c.css', express.static('src/style/c.css'));
  app.use('/bundle-wrap.js', express.static('src/js/bundle-wrap.js'));
  
  app.get('/', function (req, resp) {
    resp.set('Content-Type', 'text/html');
    resp.send(fs.readFileSync('src/views/dev.html'));
  });
  
  app.listen(8080, () => {
    console.log('Listening to 8080...');
  });
}

function localServerProd(cb) {
  const app = express();
  
  app.use('/c.css', express.static('build/c.css'));
  app.use('/b.js', express.static('build/b.js'));
  
  app.get('/', function (req, resp) {
    resp.set('Content-Type', 'text/html');
    resp.send(fs.readFileSync('build/index.html'));
  });
  
  app.listen(8080, () => {
    console.log('Listening to 8080...');
  });
}

function exportDist() {
  return src('build/*')
    .pipe(zip('archive.zip'))
    .pipe(size())
    .pipe(micro({ limit: 13 * 1024 }))
    .pipe(dest('dist'));
}

exports.concatJs = concatJs;
exports.wrapJs = wrapJs;
exports.minifyJs = minifyJs;
exports.sassCss = sassCss;
exports.renderHtmlDev = renderHtmlDev;
exports.renderHtml = renderHtml;
exports.minifyHtml = minifyHtml;
exports.staticExport = staticExport;
exports.localServer = localServer;
exports.localServerProd = localServerProd;
exports.exportDist = exportDist;

exports.buildJsDev = series(concatJs, wrapJs);
exports.buildJs = series(concatJs, wrapJs, minifyJs);

exports.buildHtmlDev = renderHtmlDev;
exports.buildHtml = series(renderHtml, minifyHtml);

exports.buildCss = sassCss;

exports.exportBuild = series(parallel(exports.buildJs, exports.buildHtml, exports.buildCss), staticExport);

exports.buildDev = parallel(exports.buildJsDev, exports.buildHtmlDev, exports.buildCss);
exports.build = exports.exportBuild;

exports.dev = series(exports.buildDev, localServer);
exports.prod = series(exports.build, localServerProd);

exports.dist = series(exports.build, exportDist);
