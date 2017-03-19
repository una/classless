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
/******/ 	return __webpack_require__(__webpack_require__.s = 5);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

// User defines config path
var configPath = './test/classless.config';
var fs = __webpack_require__(3);
var getCSSElems = __webpack_require__(1);
var htmlUtils = __webpack_require__(6);
var config = JSON.parse(fs.readFileSync(configPath));
var cssFilePath = config.cssPath;
var htmlFilePath = config.htmlPath;

// For the computed CSS file, grab the unique elements
var compiledStyles = fs.readFileSync(cssFilePath, 'utf8');
var cssElemArray = getCSSElems(compiledStyles);
//Add elements from accepted elements list to the total CSS array
var approvedElems = config.acceptedElems;
cssElemArray.push(approvedElems);

// get all of the HTML Elements used
var totalHTMLElemArray = htmlUtils.getAllHTMLElems(htmlFilePath);

function compareMatches(htmlList, cssList) {
  // Comparing total HTML to CSS Elements allowed in design system
  var unmatchedElems = htmlList.filter(function (obj) {
    return cssList.indexOf(obj) == -1;
  });

  console.log('    \uD83D\uDE2C  Uh oh! Your markup includes the\n    following elements that do not live in the\n    design system or accepted classes config:\n\n    ' + unmatchedElems + '\n\n    Please revisit the design system documenation\n    or add them to your approved class list in your\n    `classless.config` file \uD83D\uDC95  \uD83D\uDC81');

  return unmatchedElems;
}

compareMatches(totalHTMLElemArray, cssElemArray);

/***/ },
/* 1 */
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
  var filteredElems = classes.concat(ids).filter(function (v, i, a) {
    return a.indexOf(v) === i;
  });

  // Return all of the unique elements
  // console.log(filteredElems);
  return filteredElems;
}

module.exports = getClassesAndIds;

/***/ },
/* 2 */,
/* 3 */
/***/ function(module, exports) {

module.exports = require("fs");

/***/ },
/* 4 */
/***/ function(module, exports) {

module.exports = require("glob");

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(0);


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var glob = __webpack_require__(4);
var fs = __webpack_require__(3);

function getHTMLElements(htmlText) {
  var elemStrings = [];
  var allElems = [];
  var temp = void 0;

  // Get the classes
  temp = htmlText.match(/[class|id]+[ \t]*=[ \t]*['|"][^'|"]+['|"]/g);
  if (temp) {
    elemStrings.push.apply(elemStrings, temp);
  }

  elemStrings.forEach(function (elem) {
    var delimeter = '"';

    if (elem.includes("'")) {
      delimeter = "'";
    }

    var substring = elem.split(delimeter)[1].split(' ');

    // console.log(substring);

    substring.forEach(function (item) {
      // get all id elements and add '#' to all Elem list
      if (elem.startsWith("id")) {
        allElems.push('#' + item);

        // get all class elements and add '.' to all Elem list
      } else {
        allElems.push('.' + item);
      }
    });
  });

  var filteredElems = allElems.filter(function (v, i, a) {
    return a.indexOf(v) === i;
  });

  // console.log(filteredElems);
  return filteredElems;
}

// let totalHTMLElemArray = [];

// For each HTML file, run through and grab the elements (sidenote: this should be better structured)
function getAllHTMLElems(htmlFilePath) {
  var _ref;

  var eachHTMLElemArray = [];
  var files = new glob(htmlFilePath, { sync: true });

  files.forEach(function (file) {
    var htmlText = fs.readFileSync(file, 'utf8');
    eachHTMLElemArray.push(getHTMLElements(htmlText));
  });

  var totalHTMLElemArray = [].concat(_toConsumableArray(new Set((_ref = []).concat.apply(_ref, eachHTMLElemArray))));

  // Merge all of the elements from each HTML file into one array
  return totalHTMLElemArray;
};

module.exports = {
  getHTMLElements: getHTMLElements,
  getAllHTMLElems: getAllHTMLElems
};

/***/ }
/******/ ]);
//# sourceMappingURL=main.map