"use strict";

/**
 * Determine the file path, line number, and column number of where this
 * function was called from.
 * @param {number} [backDepth=0] Specify the number of lines to look back
 * on the stack trace.
 * @returns {{col: number, file: string, line: number, method: string, position: number, source: string}}
 */
module.exports = function(backDepth) {
    var err;
    var length;
    var orig;
    var result;
    var source;
    var stack;

    if (arguments.length === 0) backDepth = 0;

    // initialize the result object
    result = {
        column: 0,
        file: '',
        line: 0,
        method: '',
        position: 0,
        source: ''
    };

    // store the original prepareStack trace function and stack length
    length = Error.stackTraceLimit;
    orig = Error.prepareStackTrace;

    // set the stack trace to the needed depth and overwrite the prepare stack trace function
    Error.stackTraceLimit = backDepth + 1;
    Error.prepareStackTrace = prepareStackTrace;

    // capture the stack trace
    err = {};
    Error.captureStackTrace(err, module.exports);
    stack = err.stack;

    // restore the prepare stack trace and stack limit
    Error.stackTraceLimit = length;
    Error.prepareStackTrace = orig;

    // get the first item from the stack
    source = stack[backDepth];

    // update the result
    if (source) {
        result.column = source.getColumnNumber();
        result.file = source.getFileName();
        result.line = source.getLineNumber();
        result.method = source.getFunctionName();
        result.position = source.getPosition();
        result.source = result.file + ':' + result.line;
    }

    // add a toString method
    Object.defineProperty(result, 'toString', {
        enumerable: false,
        configurable: true,
        value: result.toString = function() {
            return result.source;
        }
    });

    return result;
};

['assert', 'dir', 'error', 'info', 'log', 'warn'].forEach(function(key) {
    var fn = console[key];
    fn.at = function() {
        var newline = typeof arguments[0] !== 'string';
        var source = module.exports(3);
        arguments[arguments.length] = (newline ? '' : '\n  ') + 'at ' + source.source;
        arguments.length++;
        fn.apply(console, arguments);
    }
});

function prepareStackTrace(_, stack) {
    return stack;
}