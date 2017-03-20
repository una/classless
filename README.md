# Classless.js

One of the biggest reasons design systems become outdated is because of enforcement and lack of updating. Classless solves all of that! The way it works is by comparing your markup to your existing design system file. If there are additional classes added, Classless will alert you to either check the design system or add it to the approved class list. This makes us pause in our development and ask two questions:

1. Do we *really* need this additional class or does it already exist?
2. Should I contribute this back to the design system or is it truly a one-off?

It also creates a list of elements that we've introduced in this project (in time-based order if adding classes to the bottom of the list), to make refactoring easier.

Classless makes sure you use less unique classes in your project and instead implement your design system to its fullest potential.

## Setup

- `npm install -g classless-js`
- `touch classless.config` & set it up with options

## Options

`classless.config` per-project options:

- `cssPath`: Link to your CSS stylesheet (single), currently local link only
- `htmlPath`: Link to your HTML paths (glob)
- `acceptedElems`: Additional accepted elements list


TODO:
- make stylesheet linkable externally or as node module in the repo
- make this pass or fail tests
- CSS as local or URL link
