module.exports = function(schema, permissions) {
    "use strict";
    /* jshint maxlen: false, node: true, strict: false */

    schema.add({ permissions: [] });

    /*permissions tree example :
    {
        'admin' : ['manage', 'delete']
        'delete': ['write']
        'write' : ['read']
        'read' : [] //Ligne pas obligatoire, implicitement défini dans 'write'
    }*/

    function uniq(t) {
        var seen = {};
        return t.filter(function(item) {
            return seen.hasOwnProperty(item) ? false : (seen[item] = true);
        })
    }

    //FLatten the whole map
    function flattenAll() {
        var result = [];
        for (var role in permissions) {
            result = result.concat(flatten(role));
        }
        return uniq(result);
    }


    //Flatten the map of a role
    function flatten(role) {
        var children = permissions[role] || [];
        var result = [role];

        for (var i in children) {
            result = result.concat(flatten(children[i]));
        }
        return result;
    }

    //Remove parent permissions from flattenpermissions when subpermissions aren't found within it
    function getParent(role) {
        var result = [];

        for (var parentRole in permissions) {
            if (permissions[parentRole].indexOf(role) > -1) {
                result.push(parentRole);
                result = result.concat(getParent(parentRole));
            }
        }
        return result;
    }


    var flattenTree = flattenAll(); //Flatten all permission in a single array (quick access)

    schema.methods.getAvailablePermissions = function() {
        return flattenTree.slice(); //Make a copy
    };

    schema.methods.can = function(permission) {
        return this.permissions.indexOf(permission) !== -1;
    };

    schema.methods.grant = function() {
        var permission, i;


        for (i = 0; i < arguments.length; ++i) {
            permission = arguments[i];
            if (!this.can(permission) && flattenTree.indexOf(permission) !== -1) {
                this.permissions = uniq(this.permissions.concat(flatten(permission)));
            }
        }
    };

    schema.methods.revoke = function(permission, revokeChildren) {
        var permissionsToRevoke = [permission];
        var i, idx, pm;

        if (revokeChildren != undefined && revokeChildren) {
            permissionsToRevoke = flatten(permission);
        }

        var allPermissions = permissionsToRevoke.slice(); //copy;


        for (i = 0; i < permissionsToRevoke.length; ++i) {
            pm = permissionsToRevoke[i];
            idx = this.permissions.indexOf(pm);

            if (idx > -1) {
                allPermissions = allPermissions.concat(getParent(pm));
            }
        }
        allPermissions = uniq(allPermissions);


        for (i = 0; i < allPermissions.length; ++i) {
            pm = allPermissions[i];
            idx = this.permissions.indexOf(pm);

            if (idx > -1) {
                this.permissions.splice(idx, 1);
            }
        }
    };
}