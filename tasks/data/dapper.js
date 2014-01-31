/**
 * Dapper - A dependency management system
 *
 * @author Andre Bluehs hello@andrebluehs.net
 */

(function() {

/**
 * Publicly accessible object
 *
 * Dapper allows dependency resolution for complex dependency trees
 */
var Dapper = {
    _impl: null,
    done: function(dep) {
        this._dapper().done(dep);
    },
    when: function(deps, callback) {
        this._dapper().when(deps, callback);
    },
    _dapper: function() {
        if (!this._impl) {
            this._impl = DapperImpl.init();
        }
        return this._impl;
    }
};

var DapperImpl = {
    // array of Waiters that we still care about
    // as they are executed we remove them from this array
    waiters: [],
    // deps that are already done so that if a waiter declares itself
    // after we've already finished a dep we can immediately execute it
    done_deps: {},
    // nothing to see here
    init: function() {
        return this;
    },
    // mark this dependency as done and notify all waiters
    done: function(dep) {
        if (dep in this.done_deps) {
            throw new Error('are you sure ' + dep + ' is ready again?');
        }
        this.done_deps[dep] = true;
        
        // let each waiter handle it's own self 
        for (var i in this.waiters) {
            var waiter = this.waiters[i];
            waiter.done(dep);
            
            // if all deps are done
            if (waiter.is_ready()) {
                // remove it as now we no longer care about it
                // delete it *before* we execute so that we don't
                // just keep done'ing a waiter
                delete this.waiters[i];
                
                waiter.execute();
            }
        }
    },
    // attempt to execute callback if all deps are already done
    // if not trim out ones that are done, wait on the rest
    when: function(deps, callback) {
        var execute_now = true;
        for (var i in deps) {
            // if it's already done, don't make the waiter wait on it
            if (deps[i] in this.done_deps) {
                delete deps[i];
            } else {
                execute_now = false;
            }
        }
        
        // let's do this (potentially)
        // we could do deps.length === 0 here, but for some reason
        // .length doesn't update when using delete keyword
        if (execute_now) {
            callback.call();
        } else {
            this.waiters.push(new Waiter(deps, callback));
        }
    }
};

/**
 * Waiter object that knows what to do about deps and a callback
 */
var Waiter = function(deps, callback) {
    this.deps = {};
    // build object of deps
    // deps are removed from this object as they finish
    for (var i in deps) {
        this.deps[deps[i]] = true;
    }
    this.callback = callback;
};

// we no longer wait on this dep
Waiter.prototype.done = function(dep) {
    if (dep in this.deps) {
        delete this.deps[dep];
    }
};

// if all our deps have been removed
Waiter.prototype.is_ready = function() {
    // this is a hack since we can't get .length of an object
    // but we still want this function to be O(1)
    for (var i in this.deps) {
        return false;
    }
    return true;
};

// onward!
Waiter.prototype.execute = function() {
    this.callback.call();
};

window.Dapper = Dapper;

// a special case for domready
document.onreadystatechange = function () {
    if (document.readyState == "complete") {
        Dapper.done('dom');
    }
};

})();