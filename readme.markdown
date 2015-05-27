##JQuery maskReplaceCyrillic plugin

This is a [jQuery](http://jquery.com/) plugin which allows user to only enter allowed symbols, replaces non-latin characters and uppercase them, which can be used for personal code inputs 

### Basic use

The plugin takes up mask, which may contain any number of characters: a, 9, or *.

1. Personal number.

    ```javascript
    $('#personalNumber').maskReplaceCyrillic('9999999a999aa9'); 
    ```
Definitions are: '9': "[0-9]", 'a': "[A-Za-z]", '*': "[A-Za-z0-9]";

Demo: https://jsfiddle.net/yw7rmo5g/