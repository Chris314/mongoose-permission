"use strict";
/* jshint maxlen: false, node: true, strict: false */
/* global require, describe, before, after, it */

var chai = require('chai');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var permissions = require('../index');
var expect = chai.expect;
var testSchema = {
    name: String,
    password: String
};


var TestSchema = Schema(testSchema);
TestSchema.plugin(permissions, {
    'administrate': ['create', 'read', 'update', 'delete'],
    'manage articles': ['publish', 'write'],
    'write': ['read'],
    'read': ['']
});
var Test = mongoose.model('Test', TestSchema);

describe('mongoose-permissions', function() {

    before(function(done) {
        mongoose.connect('mongodb://127.0.0.1/mongoose-permissions-test', done);
    });

    after(function(done) {
        mongoose.connection.db.dropDatabase(done);
    });

    it('Should grant users with permissions', function(done) {

        var model = new Test({ name: 'Test', password: 'whatever' });
        expect(model).to.have.property('permissions');

        done();
    });
    it('Grant permission should grant children permissions', function(done) {

        var model = new Test({ name: 'Test', password: 'whatever' });
        model.grant('administrate');
        expect(model.can('administrate')).to.equal(true);
        expect(model.can('create')).to.equal(true);
        expect(model.can('read')).to.equal(true);
        expect(model.can('update')).to.equal(true);
        expect(model.can('delete')).to.equal(true);
        expect(model.can('write')).to.equal(false);

        done();
    });
    it('Should ignore inexistant permissions', function(done) {

        var model = new Test({ name: 'Test', password: 'whatever' });
        model.grant('cook');
        expect(model.can('cook')).to.equal(false);
        expect(model.can('administrate')).to.equal(false);
        expect(model.can('create')).to.equal(false);
        expect(model.can('read')).to.equal(false);
        expect(model.can('update')).to.equal(false);
        expect(model.can('delete')).to.equal(false);
        expect(model.can('write')).to.equal(false);
        done();
    });
    it('Should not have inexistant permissions', function(done) {

        var model = new Test({ name: 'Test', password: 'whatever' });
        expect(model.can()).to.equal(false);
        expect(model.can('')).to.equal(false);
        done();
    });
    it('Should revoke parent permissions', function(done) {

        var model = new Test({ name: 'Test', password: 'whatever' });

        model.grant('administrate', 'write', 'create');

        expect(model.can('administrate')).to.equal(true);
        expect(model.can('write')).to.equal(true);
        expect(model.can('create')).to.equal(true);

        //read is a children of administrate and write but not create
        model.revoke('read');

        expect(model.can('administrate')).to.equal(false);
        expect(model.can('write')).to.equal(false);
        expect(model.can('create')).to.equal(true);

        done();
    });
    it('Should revoke children if needed', function(done) {

        var model = new Test({ name: 'Test', password: 'whatever' });

        model.grant('administrate', 'write');

        expect(model.can('administrate')).to.equal(true);
        expect(model.can('write')).to.equal(true);
        expect(model.can('create')).to.equal(true);
        expect(model.can('read')).to.equal(true);
        expect(model.can('update')).to.equal(true);
        expect(model.can('delete')).to.equal(true);

        //read is a children of administrate and write but not create
        model.revoke('administrate', true);

        expect(model.can('administrate')).to.equal(false);
        expect(model.can('write')).to.equal(false); //Read had been removed, can't write anymore
        expect(model.can('create')).to.equal(false);
        expect(model.can('read')).to.equal(false);
        expect(model.can('update')).to.equal(false);
        expect(model.can('delete')).to.equal(false);
        done();
    });
});