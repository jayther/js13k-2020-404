Employee not Found
==================

An entry for JS13KGames 2020, with the theme "404".

## Technical Info

- Custom game engine with basic DisplayObject-style scene graph and essential rendering components.
- The blue top-down robot graphic from https://kenney.nl/
- gulp.js build system with modules.
- Mustache (via gulp-mustache) for template string replacements during build
- Normal web JavaScript, concatenating JavaScript files into one (via gulp-concat).
- UglifyJS (via gulp-uglify) for minifying JS, with name-mangling option enabled.
- gulp-htmlmin for minifying HTML.
- gulp-sass for variables and minifying CSS
- gzip (via gulp-zip) for compressing.
- express for local testing.

## Setup

`npm install`

## Build (no minify)

`npm run gulp build`

or, with gulp globally installed:

`gulp build`

or, in VSCode, `gulp build` is the default build task:

`Ctrl+Shift+B`

This generates `src/js/bundle-wrap.js`

## Build (minified)

`npm run gulp buildProd`

or, with gulp globally installed:

`gulp buildProd`

This generates a folder `build` with `b.js`, `c.css`, `index.html`, and any
image files.

## Local Dev

`npm run gulp dev`

or, with gulp globally installed:

`gulp dev`

or, in VSCode, there is a "Gulp Dev" Launch task.

Visit `http://localhost:5000`

Also, there is a Launch Chrome task.

For testing minified files, run `gulp prod`. This will also be available at
`http://localhost:5000`

## Distribution (zip)

`npm run gulp dist`

or, with gulp globally installed:

`gulp dist`

This generates `dist/archive.zip`.

## Postmortem

Link: https://medium.com/@jayther/employee-not-found-js13k-2020-postmortem-d4c40a9ad70c
