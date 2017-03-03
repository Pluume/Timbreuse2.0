"use strict";
var expect      = require('chai').expect;
var at          = require('../index');

describe('console-at', function() {

    describe('0 deep', function() {

        it('column', function() {
            var source = at(0);
            expect(source.column).to.equal(26);
        });

        it('line', function() {
            var source = at(0);
            expect(source.line).to.equal(15);
        });

        it('position', function() {
            var source = at(0);
            expect(source.position).to.equal(543);
        });

        it('file', function() {
            var source = at(0);
            expect(source.file).to.equal(__filename);
        });

        it('method', function() {
            var source = at(0);
            expect(source.method).to.equal(null);
        });

        it('source', function() {
            var source = at(0);
            expect(source.source).to.equal(__filename + ':35');
        });

        it('toString', function() {
            var source = at(0);
            expect('' + source).to.equal(__filename + ':40');
        });

    });

    describe('1 deep', function() {

        function foo() {
            return at(1);
        }

        it('column', function() {
            var source = foo();
            expect(source.column).to.equal(26);
        });

        it('line', function() {
            var source = foo();
            expect(source.line).to.equal(58);
        });

        it('position', function() {
            var source = foo();
            expect(source.position).to.equal(1579);
        });

        it('file', function() {
            var source = foo();
            expect(source.file).to.equal(__filename);
        });

        it('method', function() {
            var source = foo();
            expect(source.method).to.equal(null);
        });

        it('source', function() {
            var source = foo();
            expect(source.source).to.equal(__filename + ':78');
        });

        it('toString', function() {
            var source = foo();
            expect('' + source).to.equal(__filename + ':83');
        });

    });

    it('within function', function() {
        function foo() {
            var source = at(0);
            expect(source.method).to.equal('foo');
        }
        foo();
    });
    
});