# mongoose-permission

[![NPM version](http://img.shields.io/npm/v/mongoose-permission.svg?style=plastic)](https://www.npmjs.org/package/mongoose-permission)
[![Dependency Status](http://img.shields.io/david/chris314/mongoose-permission.svg?style=plastic)](https://gemnasium.com/chris314/mongoose-permission)
[![Dependency Status](http://img.shields.io/david/dev/chris314/mongoose-permission.svg?style=plastic)](https://gemnasium.com/chris314/mongoose-permission)


This is a mongoose plugin to add permissions to a model :
* A model can have multiple permissions at once
* "Master" permissions can be defined by having children permissions
* If a  children permission is revoked then master will be revoked too.
* Granting a master permission also grant all children

It may not be the best logic, but it suited to my personnal needs. It gives the possibility to easely grant or revoke permissions to an user and handle automatically master permissions. 
This way I can avoid the fact that an user doesn't have all permissions needed to make a task.

## Installation

```bash
npm install --save mongoose-permission
```

## Usage

```javascript
'use strict';

var UserSchema = new require('mongoose').Schema({
  name: String,
  password: String
});

//Permission tree initialization
UserSchema.plugin(require('mongoose-permission'), {
    'administrate': ['create', 'read', 'update', 'delete'],
    'manage articles': ['publish', 'write'],
    'write': ['read'],
    'read': ['']
});

var User = mongoose.model('User', UserSchema);

var chris= new User({name: 'chris pi' ... });

chris.grant('administrate'); //Pass any number of permissions separated by ',' : chris.grant('read','write',...)

console.log(chris.can('administrate')); // true
console.log(chris.can('read')); // true
console.log(chris.can('write')); // false
console.log(chris.can('create')); // true

chris.revoke('administrate');

console.log(chris.can('administrate')); // false
console.log(chris.can('read')); // true
console.log(chris.can('write')); // false
console.log(chris.can('create')); // true

...

chris.grant('administrate','write');
console.log(chris.can('administrate')); // true
console.log(chris.can('read')); // true
console.log(chris.can('write')); // true
console.log(chris.can('create')); // true

...

//Revoking children if needed
chris.revoke('administrate', true);
console.log(chris.can('administrate')); // false
console.log(chris.can('read')); // false
console.log(chris.can('write')); // false => write need read, but lost by revoking children
console.log(chris.can('create')); // false

```

This plugin adds a `permissions` String array to a schema, containing all permissions granted, plus a bunch of methods :
* Granting : `grant(permission1[, permission2[, permission3 ...]])`
* Revoking : `revoke(permission, revokeChildren)`
* Chicking: `can(permission)`
* Getting possibilities : `getAvailablePermissions()`

It it required that you pass in permissions to the plugin. This way you cannot grant a user to generated permissions, I may add a possibility to do this later, but my main goal by doing it this way is to have to think to all possibility and not to deviate and invent new ones every now and then...

You can use this in a middleware function to check if an user can perform or access a specific page or functionnality. 