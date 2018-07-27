var client = require('../src/client');
var helpers = require('./helpers');

// Define some constants needed for testing
var mime = 'application/json';
var version = '1.0';
var requestMessage = {};
requestMessage.toObject = function() {
    return {};
};

describe('client.js', function() {
    describe('snakeCaseKeys()', function() {
        test('should not snake case key', function() {
            var result = client.snakeCaseKeys({ 'deck': { 'key': 'value123' } });
            expect(Object.keys(result).length).toBe(1);
            expect(Object.keys(result)[0]).toBe('deck');
            var value = result['deck'];
            expect(Object.keys(value).length).toBe(1);
            expect(Object.keys(value)[0]).toBe('key');
            expect(value['key']).toBe('value123');
        });
        test('should snake case key', function() {
            var result = client.snakeCaseKeys({ 'deckId': { 'key': 'value123' } });
            expect(Object.keys(result).length).toBe(1);
            expect(Object.keys(result)[0]).toBe('deck_id');
            var value = result['deck_id'];
            expect(Object.keys(value).length).toBe(1);
            expect(Object.keys(value)[0]).toBe('key');
            expect(value['key']).toBe('value123');
        });
        test('should snake case key with _list postfix', function() {
            var result = client.snakeCaseKeys({ 'deckIdList': { 'key': 'value123' } });
            expect(Object.keys(result).length).toBe(1);
            expect(Object.keys(result)[0]).toBe('deck_id_list');
            var value = result['deck_id_list'];
            expect(Object.keys(value).length).toBe(1);
            expect(Object.keys(value)[0]).toBe('key');
            expect(value['key']).toBe('value123');
        });
        test('should snake case key with _list postfix removed if value is a list', function() {
            var result = client.snakeCaseKeys({ 'deckIdList': ['value123'] });
            expect(Object.keys(result).length).toBe(1);
            expect(Object.keys(result)[0]).toBe('deck_id');
            var value = result['deck_id'];
            expect(Array.isArray(value)).toBe(true);
            expect(value.length).toBe(1);
            expect(value[0]).toBe('value123');
        });
        test('should snake case key with _list postfix removed if value is a list, deep copy', function() {
            var result = client.snakeCaseKeys({ 'deckIdList': [{ 'cardsList': ['value123'] }] });
            expect(Object.keys(result).length).toBe(1);
            expect(Object.keys(result)[0]).toBe('deck_id');
            var value = result['deck_id'];
            expect(Array.isArray(value)).toBe(true);
            expect(value.length).toBe(1);
            expect(Object.keys(value[0]).length).toBe(1);
            var value2 = value[0]
            expect(Object.keys(value2).length).toBe(1);
            expect(Object.keys(value2)[0]).toBe('cards');
            expect(value2['cards'].length).toBe(1);
            expect(value2['cards'][0]).toBe('value123');
        });
    });
    describe('extendHeaders()', function() {
        test('should return empty object on undefined', function() {
            var headers = client.extendHeaders();
            expect(Object.keys(headers).length).toBe(0);
        });
        test('should not extend if extras is empty', function() {
            var headers = client.extendHeaders({}, { 'foo': 'bar' });
            expect(Object.keys(headers).length).toBe(1);
            expect(headers['foo']).toBe('bar');
        });
        test('should not extend if extras is undefined', function() {
            var headers = client.extendHeaders(undefined, { 'foo': 'bar' });
            expect(Object.keys(headers).length).toBe(1);
            expect(headers['foo']).toBe('bar');
        });
        test('should merge in extras', function() {
            var headers = client.extendHeaders({ 'extra': 'baz' }, { 'foo': 'bar' });
            expect(Object.keys(headers).length).toBe(2);
            expect(headers['foo']).toBe('bar');
            expect(headers['extra']).toBe('baz');
        });
        test('should extend with extras only', function() {
            var headers = client.extendHeaders({ 'extra': 'baz' });
            expect(Object.keys(headers).length).toBe(1);
            expect(headers['extra']).toBe('baz');
        });
    });
    describe('makeHeaders()', function() {
        test('should add mime and version headers', function() {
            var headers = client.makeHeaders({}, mime, version);
            expect(headers['Content-Type']).toBe(mime);
            expect(headers['Accept']).toBe(mime);
            expect(headers['Twirp-Version']).toBe(version);
            expect(Object.keys(headers).length).toBe(3);
        });
        test('should not extend if there are no extras', function() {
            var headers = client.makeHeaders({}, mime, version, { 'foo': 'bar' });
            expect(Object.keys(headers).length).toBe(4);
            expect(headers['foo']).toBe('bar');
        });
        test('should merge in extras', function() {
            var headers = client.makeHeaders({ 'extra': 'baz' }, mime, version, { 'foo': 'bar' });
            expect(Object.keys(headers).length).toBe(5);
            expect(headers['foo']).toBe('bar');
            expect(headers['extra']).toBe('baz');
        });
        test('should extend with extras only', function() {
            var headers = client.makeHeaders({ 'extra': 'baz' }, mime, version);
            expect(Object.keys(headers).length).toBe(4);
            expect(headers['extra']).toBe('baz');
        });
    });
    describe('clientFactory()', function() {
        test('should add custom headers', function() {
            var factory = client.clientFactory(function(url, opts) {
                expect(opts.headers['extra']).toBe('baz');
                return new Promise(function(resolve, reject) {
                    resolve({ status: 200 });
                });
            }, helpers.jsonSerialize, helpers.jsonDeserialize);
            var rpc = factory('http://localhost', 'api', '1.0', true);
            rpc('SomeMethod', requestMessage, null, { 'extra': 'baz' });
        });
        test('should not break rpc call on undefined custom headers', function() {
            var factory = client.clientFactory(function(url, opts) {
                expect(Object.keys(opts.headers).length).toBe(3);
                expect(opts.headers['Content-Type']).toBe(mime);
                expect(opts.headers['Accept']).toBe(mime);
                expect(opts.headers['Twirp-Version']).toBe(version);
                return new Promise(function(resolve, reject) {
                    resolve({ status: 200 });
                });
            }, helpers.jsonSerialize, helpers.jsonDeserialize);
            var rpc = factory('http://localhost', 'api', version, true);
            rpc('SomeMethod', requestMessage, null);
        });
    });
});