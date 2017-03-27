# Classless.js

One of the biggest reasons design systems become outdated is because of enforcement and lack of updating. Classless solves all of that! The way it works is by comparing your markup to your existing design system file. If there are additional classes added, Classless will alert you to either check the design system or add it to the approved class list. This makes us pause in our development and ask two questions:

1. Do we *really* need this additional class or does it already exist?
2. Should I contribute this back to the design system or is it truly a one-off?

It also creates a list of elements that we've introduced in this project (in time-based order if adding classes to the bottom of the list), to make refactoring easier.

Classless makes sure you use less unique classes in your project and instead implement your design system to its fullest potential.

## Setup

- globally install classless with `npm install -g classless-js`
- at your root directory, `touch classless.config` & set it up with options
- run `classless` in your CLI once this is set up in your project

## Options

`classless.config` per-project options:

- `cssPath`: Link to your CSS stylesheet(s) -- You can link to a directory of files, but compiled CSS works best because this doesn't take into account things like Sass mixins, etc. Examples: `./bower_components/unicornDesignSystem/app/**/*.scss` or `css/**/*`
- `htmlPath`: Link to your HTML path(s). Can be any format (i.e. `.erb`, `.hbs`, etc.)
- `acceptedElems`: Additional accepted elements list

## Contributing

The `/bin` folder is where all of the executable scripts live. Please update and submit a PR.
