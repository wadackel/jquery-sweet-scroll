jquey-sweet-scroll
================

[![NPM](https://nodei.co/npm/jquery-sweet-scroll.png?compact=true)](https://nodei.co/npm/jquery-sweet-scroll/)

It is possible to easily and flexibly implement smooth scrolling in the same page.


## Demo

[![screenshot](https://raw.githubusercontent.com/tsuyoshiwada/jquery-sweet-scroll/images/sweet-scroll.png)](https://tsuyoshiwada.github.com/jquery-sweet-scroll/)

[demo](https://tsuyoshiwada.github.com/jquery-sweet-scroll/)


## Requirements

`jQuery 1.7.2 +` or `Zepto 1.1.x +`


## Install

### npm

```
$ npm install jquery-sweet-scroll
```

### Bower

```
$ bower install jquery-sweet-scroll
```

### Manual

```html
<script src="jquery.sweetScroll.min.js"></script>
```


## Usage
It is very simple.

### HTML

```html
<a href="#header">To #header</a>
```

### JavaScript

```javascript
// Start by clicking the anchor that begins with "#"
$("a[href^='#']").sweetScroll();
```

## Options

### duration
**type: integer | "auto"**  
**default: 1200**  
Specifies the scroll animation speed.  

### delay
**type: integer**  
**default: 0**  
Specifies the milliseconds to start to scroll.

### easing
**type: string**  
**default: "easeOutQuint"**  
Specifies the easing function of scroll.  
The following can be used by default.

**jQuery:**

* "linear"
* "swing"
* "easeInQuint"
* "easeOutQuint"
* "easeInOutQuint"

To use the other easing functions to install such as [jQuery.easing.js](http://gsgd.co.uk/sandbox/jquery/easing/).

**Zepto:**

* "linear"
* "ease-in"
* "ease-out"
* "ease-in-out"

### target
**type: string**  
**default: null**  
Specifies the target of the scroll position.

**Example:**  

```javascript
$(selector).sweetScroll({
  target: "#header"
});
```

### to
**type: mixed**  
**default: null**  
Specifies the scroll positions.
various specification format of `href` and `to` and `offset` option.

```javascript
// Object format
{top:100, left:400}
{top:1000}

// Like the object format
"top:100, left:400"
"top:1000"

// Array format
[500, 0]

// Like the array format
"500,1000"

// Numeric format
500
```

### offset
**type: mixed**  
**default: null**  
Adjust the scroll positions.  
Please specify format Check the `to` option.

### autoCoefficient
**type: integer**  
**default: 2**  
Coefficient for "auto" speed.

### stopScroll
**type: boolean**  
**default: true**  
Stop scrolling in any of the events of the wheel or touch start(move).

### changeHash
**type: boolean**  
**default: false**  
Change the hash after scrolled.

### verticalScroll
**type: boolean**  
**default: true**  
Enable the vertical scroll.

### horizontalScroll
**type: boolean**  
**default: false**  
Enable the horizontal scroll.

### loadedScroll
**type: boolean**  
**default: false**  
Scroll to the position of the hash when the page read.

### loadedScrollQuery
**type: boolean**  
**default: false**  
Scroll to the position of the query string when the page read.  
The priority than the `loadedScroll` option.

### stopPropagation
**type: boolean**  
**default: true**  
Stop the bubbling of anchor click event.

### useVelocity
**type: boolean**  
**default: true**  
if `velocity` is possible to use from the `jQuery` or `Zepto` is used as an alternative to `animate()` method.

### beforeScroll
**type: function**  
**default: null**  
**param: object**  
function to be called before scrolling occurs.  
The argument contains the property to be used for the animation.  
In addition, you can interrupt the operation by returning false to this function.

### afterScroll
**type: function**  
**default: null**  
**param: object**
function to be called after scroll animation occurs.
The argument contains the property to be used for the animation.

### cancelScroll
**type: function**  
**default: null**  
function to be called the scroll is canceled.


## Custom Event
Original event with the same name as the callback you can use.

**Example:**

```javascript
$("a[href^='#']")
  .sweetScroll() //Run the SweetScroll
  .on("sweetscroll.beforeScroll", function(e){
    // ...
  })
  .on("sweetscroll.afterScroll", function(e){
    // ...
  })
  .on("sweetscroll.cancelScroll", function(e){
    // ...
  });
```


## Methods

### Local

```javascript
// Disable SweetScroll.
$(selector).sweetScroll("disable");

// Enable SweetScroll.
$(selector).sweetScroll("enable");

// Disable SweetScroll.
$(selector).sweetScroll("destroy");
```

### Public

```javascript
// Specify the operation at the time of page load.
// You need to run before the DOMContentLoaded event.
$.sweetScroll("loaded", {
  // parametors.
});

// Global Disable SweetScroll.
$.sweetScroll("disable");

// Global Enable SweetScroll.
$.sweetScroll("enable");

// Global Destroy SweetScroll.
$.sweetScroll("destroy");
```


## Browser Support

### Using jQuery

* Internet Explorer 7 +
* Chrome
* Safari
* Firefox
* iOS 5 +
* Android 2.3

### Using Zepto

* Internet Explorer 9 +
* Chrome
* Safari
* Firefox
* iOS 5 +
* Android 2.3


## Licence
Released under the [MIT Licence](https://github.com/tsuyoshiwada/jquery-sweet-scroll/blob/master/LICENCE)


## Author
[tsuyoshi wada](https://github.com/tsuyoshiwada/)
