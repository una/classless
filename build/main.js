require('source-map-support/register')
module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

var fs = __webpack_require__(1);
var getCSSElems = __webpack_require__(3);
var cssFilePath = './test/testStyles.css';
var htmlFilePath = './test/test.html';

var compiledStyles = fs.readFileSync(cssFilePath, 'utf8');

console.log(compiledStyles);
getCSSElems(compiledStyles);

/***/ },
/* 1 */
/***/ function(module, exports) {

module.exports = require("fs");

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(0);


/***/ },
/* 3 */
/***/ function(module, exports) {

function getClassesAndIds(stylesheet) {
  var classes = [];
  var ids = [];
  var temp = void 0;

  // Get the classes
  temp = stylesheet.match(/\.\D\w+/g);
  if (temp) {
    classes.push.apply(classes, temp);
  }

  // Get the IDs
  temp = stylesheet.match(/\#\D\w+/g);
  if (temp) {
    ids.push.apply(ids, temp);
  }

  // Combine classes and ID's and filter for unique ones
  var allElems = classes.concat(ids).filter(function (v, i, a) {
    return a.indexOf(v) === i;
  });

  // Return all of the unique elements
  console.log(allElems);
  return allElems;
}

module.exports = getClassesAndIds;

/***/ }
/******/ ]);
//# sourceMappingURL=main.map