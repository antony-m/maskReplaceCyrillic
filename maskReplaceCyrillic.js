(function($) {

    "use strict";
    $.fn.maskReplaceCyrillic = function(mask) {
        var $this = $(this);
        var definitions = {
            '9': "[0-9]",
            'a': "[A-Za-z]",
            '*': "[A-Za-z0-9]"
        };

        mask = mask || '';

        var str;

        var map = {
            '65': 'A',
            '66': 'B',
            '67': 'C',
            '68': 'D',
            '69': 'E',
            '70': 'F',
            '71': 'G',
            '72': 'H',
            '73': 'I',
            '74': 'J',
            '75': 'K',
            '76': 'L',
            '77': 'M',
            '78': 'N',
            '79': 'O',
            '80': 'P',
            '81': 'Q',
            '82': 'R',
            '83': 'S',
            '84': 'T',
            '85': 'U',
            '86': 'V',
            '87': 'W',
            '88': 'X',
            '89': 'Y',
            '90': 'Z',
        };

        var selectionLength, start, end = null;
        $.fn.caret = function(begin, end) {
            var range;

            if (this.length === 0 || this.is(":hidden")) {
                return;
            }

            if (typeof begin == 'number') {
                end = (typeof end === 'number') ? end : begin;
                return this.each(function() {
                    if (this.setSelectionRange) {
                        this.setSelectionRange(begin, end);
                    } else if (this.createTextRange) {
                        range = this.createTextRange();
                        range.collapse(true);
                        range.moveEnd('character', end);
                        range.moveStart('character', begin);
                        range.select();
                    }
                });
            } else {
                if (this[0].setSelectionRange) {
                    begin = this[0].selectionStart;
                    end = this[0].selectionEnd;
                } else if (document.selection && document.selection.createRange) {
                    range = document.selection.createRange();
                    begin = 0 - range.duplicate().moveStart('character', -100000);
                    end = begin + range.text.length;
                }
                return {
                    begin: begin,
                    end: end
                };
            }
        }

        //take text selection range 
        $this.select(function(e) {

            function getInputSelection(el) {
                var start = 0,
                    end = 0,
                    normalizedValue, range,
                    textInputRange, len, endRange;

                if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
                    start = el.selectionStart;
                    end = el.selectionEnd;
                } else {
                    //IE8 doesn't support selectionStart & selectionEnd
                    range = document.selection.createRange();

                    if (range && range.parentElement() == el) {
                        len = el.value.length;
                        normalizedValue = el.value.replace(/\r\n/g, "\n");

                        // Create a working TextRange that lives only in the input
                        textInputRange = el.createTextRange();
                        textInputRange.moveToBookmark(range.getBookmark());

                        // Check if the start and end of the selection are at the very end
                        // of the input, since moveStart/moveEnd doesn't return what we want
                        // in those cases
                        endRange = el.createTextRange();
                        endRange.collapse(false);

                        if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                            start = end = len;
                        } else {
                            start = -textInputRange.moveStart("character", -len);
                            start += normalizedValue.slice(0, start).split("\n").length - 1;

                            if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                                end = len;
                            } else {
                                end = -textInputRange.moveEnd("character", -len);
                                end += normalizedValue.slice(0, end).split("\n").length - 1;
                            }
                        }
                    }
                }

                return {
                    start: start,
                    end: end
                };
            }

            start = getInputSelection(this).start;
            end = getInputSelection(this).end;
            selectionLength = end - start;
        });

        //detect if ctrl key is pressed
        var ctrlDown = false;
        var ctrlKey = 17;

        $(document).keydown(function(e) {
            if (e.keyCode == ctrlKey) ctrlDown = true;
        }).keyup(function(e) {
            if (e.keyCode == ctrlKey) ctrlDown = false;
        });

        //detect if shift key is pressed
        var shiftDown = false;
        var shiftKey = 16;

        $(document).keydown(function(e) {
            if (e.keyCode == shiftKey) shiftDown = true;
        }).keyup(function(e) {
            if (e.keyCode == shiftKey) shiftDown = false;
        });


        $this.on("blur focus mousedown", function() {
            selectionLength = null;
            start = null;
            end = null;
        });

        //reformat on paste
        $this.on('paste', function(e) {
            var self = this;
            if (!start && !end) {
                start = 1;
                end = 1;
            }

            var $self = $(self);
            var original = e.originalEvent;
            var val = null;

            // Get the text content stream.
            if (window.clipboardData && window.clipboardData.getData) { // IE
                val = window.clipboardData.getData('Text');
            } else if (original.clipboardData && original.clipboardData.getData) {
                val = original.clipboardData.getData('text/plain');
            }

            //check if text input value is correct when pasting
            function reformatInputValuePaste() {
                var currentCaretPos = $self.caret().begin;
                var caretEndPosition = end + val.length - (end - start);

                var a = $self.val();
                var b = val;
                var out;

                if (end - start > 0) {
                    out = [a.slice(0, start), b, a.slice(end)].join('');
                } else {
                    out = [a.slice(0, currentCaretPos), b, a.slice(currentCaretPos)].join('');
                }

                for (var i = 0; i < out.length; i++) {
                    var regex = new RegExp(definitions[mask.charAt(i)]);

                    if (mask.charAt(i) === '') {
                        return false;
                    }

                    if (!regex.test(out.charAt(i))) {
                        return false;
                    }
                }
                $self.val(out);
                $self.caret(caretEndPosition);

            }

            reformatInputValuePaste();

            // Stop the actual content from being pasted.
            e.preventDefault();
            return false;

        });


        $this.on('keydown', function(e) {
            var self = this;
            var $self = $(self);
            var currentCaretPos = $this.caret().begin;

            //check if text value matches mask requirements
            function maskCheck() {

                var key = e.which || e.keyCode;

                var inputC = String.fromCharCode((96 <= key && key <= 105) ? key - 48 : key);

                if (key == 8 || key == 46) {
                    inputC = '';
                }

                var aa = $self.val();
                var bb = map[e.keyCode.toString()] || inputC;
                var out;
                if (end - start > 0) {
                    out = [aa.slice(0, start), bb, aa.slice(end)].join('');
                } else {
                    out = [aa.slice(0, currentCaretPos), bb, aa.slice(currentCaretPos)].join('');
                }

                //delete action handling
                if (key == 46) {

                    //when some text selected 
                    if (end - start > 0) {
                        out = [aa.slice(0, start), bb, aa.slice(end)].join('');
                        for (i = 0; i < out.length; i++) {
                            regexFull = new RegExp(definitions[mask.charAt(i)]);

                            if (mask.charAt(i) === '') {
                                return false;
                            }

                            if (!regexFull.test(out.charAt(i))) {
                                return false;
                            }
                        }
                        $self.val(out);
                        $self.caret(start);
                    } else {
                        out = [aa.slice(0, currentCaretPos), bb, aa.slice(currentCaretPos + 1)].join('');
                        for (i = 0; i < out.length; i++) {
                            regexFull = new RegExp(definitions[mask.charAt(i)]);

                            if (mask.charAt(i) === '') {
                                return false;
                            }

                            if (!regexFull.test(out.charAt(i))) {
                                return false;
                            }
                        }
                        $self.val(out);
                        $self.caret(currentCaretPos);
                    }
                    selectionLength = null;
                    start = null;
                    end = null;
                }

                //backspace action handling
                if (key == 8) {
                    if (end - start > 0) {
                        out = [aa.slice(0, start), bb, aa.slice(end)].join('');
                        for (i = 0; i < out.length; i++) {
                            regexFull = new RegExp(definitions[mask.charAt(i)]);

                            if (mask.charAt(i) === '') {
                                return false;
                            }

                            if (!regexFull.test(out.charAt(i))) {
                                return false;
                            }
                        }
                        $self.val(out);
                        $self.caret(start);
                    } else {
                        out = [aa.slice(0, currentCaretPos - 1), bb, aa.slice(currentCaretPos)].join('');
                        for (i = 0; i < out.length; i++) {
                            regexFull = new RegExp(definitions[mask.charAt(i)]);

                            if (mask.charAt(i) === '') {
                                return false;
                            }

                            if (!regexFull.test(out.charAt(i))) {
                                return false;
                            }
                        }
                        $self.val(out);
                        $self.caret(currentCaretPos - 1);

                    }
                    selectionLength = null;
                    start = null;
                    end = null;

                }

                for (var i = 0; i < out.length; i++) {
                    var regexFull = new RegExp(definitions[mask.charAt(i)]);
                    if (mask.charAt(i) === '') {
                        return false;
                    }

                    if (!regexFull.test(out.charAt(i))) {
                        return false;
                    }

                }

                if (out.length > mask.length) {
                    return false;
                }

                //var key = e.keyCode;

                var inputChar = String.fromCharCode((96 <= key && key <= 105) ? key - 48 : key);

                var regex = new RegExp(definitions[mask.charAt(currentCaretPos)]);

                if (!mask.charAt(currentCaretPos)) {
                    regex = false;
                }

                if (key == 106 || key == 107 || (key >= 109 && key <= 111)) {
                    return false;
                }

                if (shiftDown && key >= 48 && key <= 57) {
                    return false;
                }

                if (regex && regex.test(inputChar)) {
                    return true;
                } else return false;
            }

            e = e || window.event;
            var charCode = e.which || e.keyCode;

            //mask matching ontype
            if (charCode == 46 || charCode == 8) {
                if (!maskCheck()) {
                    return false;
                }
            }

            if (charCode != 17 && !ctrlDown && charCode != 37 && charCode != 39 && charCode != 16 && charCode != 8 && charCode != 46 && !selectionLength && charCode != 9) {

                if (!maskCheck()) {
                    return false;
                }
            }

            if (charCode != 17 && !ctrlDown && charCode != 37 && charCode != 39 && charCode != 16 && selectionLength && charCode != 8 && charCode != 46 && charCode != 9) {

                if (!maskCheck()) {
                    return false;
                }

                var strValue = $this.val();
                var strTail = strValue.substring(end);
                strValue = strValue.slice(0, start);
                strValue += strTail;
                $this.val(strValue);

                $this.caret(currentCaretPos);
                selectionLength = null;
            }

            if (charCode == 37 || charCode == 39) {
                selectionLength = null;
            }


            if (!ctrlDown && (charCode >= 65 && charCode <= 90) || (charCode >= 48 && charCode <= 57) || (charCode >= 96 && charCode <= 105)) {

                e.preventDefault();

                currentCaretPos = $this.caret().begin;

                var inputChar = String.fromCharCode((96 <= charCode && charCode <= 105) ? charCode - 48 : charCode);

                str = $this.val();
                if (currentCaretPos === str.length) {
                    var r = '';
                    if ((charCode >= 48 && charCode <= 57) || (charCode >= 96 && charCode <= 105)) {
                        r += str + inputChar;
                    } else {
                        r += str + map[charCode.toString()] || charCode.toString();
                    }
                    $this.val(r);

                    $this.caret(currentCaretPos + 1);

                } else {
                    if (!selectionLength || selectionLength === 0) {
                        var b;
                        if ((charCode >= 48 && charCode <= 57) || (charCode >= 96 && charCode <= 105)) {
                            b = inputChar;
                        } else {
                            b = map[charCode.toString()] || charCode.toString();
                        }
                        var a = $this.val();
                        var output = [a.slice(0, currentCaretPos), b, a.slice(currentCaretPos)].join('');

                        if (output.length > mask.length) {
                            return false;
                        }

                        $this.val(output);
                        $this.caret(currentCaretPos + 1);
                    }
                }
            }
        });
    };

})(jQuery);