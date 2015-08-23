/*global Promise, amd_core, self, window, Math, amd_cf*/
/*jslint todo: true evil:true */

var amd_cf = (function () {
    'use strict';
    var workersPackage, core, isArray, getEquation, checkEquation, main, workerScript, checkAndBuildData, gotten, worker, createRetObj;

    //Note: This indicates that this package and fitCurvesWorkers must be in the same
    // Directory, if they are not, this location needs to be changed...
    workerScript = 'amd_cf_worker-1.2.1.min.js';
    workersPackage = 'amd_ww-2.0.0.min.js';
    main = {};
    gotten = {};
    core = amd_core;
    isArray = core.isArray;

    //This insures that workersPackage loads
    core.require({async: [workersPackage], callback: function (resObj) {
        if (!resObj[workersPackage].loaded || !window.amd_ww) {
            //Kill execution if this is not loaded.
            resObj.promise.then(function (err) {
                console.error(err);
                throw 'amd_ww is required for this curve fitting package, ' +
                    'download at: https://github.com/adussaq/amd_ww/';
            });
        } else {
            // Set up this package
            worker = window.amd_ww.startWorkers({filename: workerScript});
            main.getEquation = getEquation;
        }
    }});

    checkEquation = function (eq, url) {
        var ret = [true, undefined];
        if (!eq || typeof eq !== 'object') {
            ret[1] = 'Equation object at ' + url + ' is not an object, see: https://github.com/adussaq/amd_cf/blob/gh-pages/README.md#equation_obj for more information.';
            ret[0] = false;
        }
        if (!eq.hasOwnProperty('func') || typeof eq.func !== 'function') {
            ret[1] = 'Equation object at ' + url + ' does not have a proper ".func" property, see: https://github.com/adussaq/amd_cf/blob/gh-pages/README.md#equation_obj for more information.';
            ret[0] = false;
        }
        if (!eq.hasOwnProperty('setInitial') || typeof eq.setInitial !== 'function') {
            ret[1] = 'Equation object at ' + url + ' does not have a proper ".setInitial" property, see: https://github.com/adussaq/amd_cf/blob/gh-pages/README.md#equation_obj for more information.';
            ret[0] = false;
        }
        if (!ret[0]) {
            ret[1] = new Error(ret[1]);
        }
        return ret;
    };

    checkAndBuildData = function (data, eq) {
        data.equation = eq;

        //This is done to allow chaining
        return new Promise(function (resolve, reject) {
            //Check a number of things that could be wrong...
            if (!data.hasOwnProperty('x_values')) {
                reject(new Error('Must inlcude x_values as an property on data'));
            } else if (!data.y_values) {
                reject(new Error('Must inlcude y_values as an property on data'));
            } else if (!isArray(data.x_values) || !isArray(data.y_values)) {
                reject(new Error('Both x_values and y_values must be arrays'));
            } else if (data.x_values.length !== data.y_values.length) {
                reject(new Error('The length of x_values and y_values must be the same'));
            } else if (!isArray(data.x_values[0])) {
                reject(new Error('data.x_values must be an array of arrays, each array represents the X vector for each point.'));
            } else {
                resolve(data);
            }
        });
    };

    getEquation = function (url) {
        var ret;
        //Check if URL has been asked for already
        if (gotten[url]) {
            //if so just return the promise
            ret = gotten[url];
        } else {
            //Create the promise object
            ret = createRetObj(url);
        }
        return ret;
    };

    createRetObj = function (url) {
        //Variable Declarations
        var promises, retObj, fitEquation, evaleq, equation;

        //Variable Definitions
        promises = [];
        retObj = Object.create(Promise); // Just like with web workers
                //this is a promise object with some extras added on

        fitEquation = function (data) {
            var eqProm;
            eqProm = retObj.equation.then(function () {
                //once equation has been gotten, check data submitted
                return checkAndBuildData(data, equation);
            }).then(function (res) {
                //Data is good, submit for fitting
                return worker.submit(res);
            }).then(function (res) {
                //Got the result, clean it up and return it
                var ret;

                ret = res[1];
                ret.data = res[0];
                ret.data.equation = evaleq(equation);
                return ret;
            });
            promises.push(eqProm.catch(function () {
                //This is so 'all' can still work
                return undefined;
            }));
            return eqProm;
        };

        evaleq = function (str) {
            var eq = {};
            eq = eval('eq = ' + str); // Done this way so the complier will work
            return eq;
        };

        //Do the actual work of the function.
        (function () {
            //declare variables
            var successFunc, errorFunc;

            successFunc = function (resolve, reject) {
                return function (res) {
                    var eq, ce;
                    //I have two so the local equation cannot be changed by editing the returned one.
                    eq = evaleq(res);

                    //Make sure the equation is ok
                    ce = checkEquation(eq, url);
                    if (!ce[0]) {
                        //if it is not ce[1] contains the error message
                        console.error(ce[1]);
                        reject(ce[1]);
                    } else {
                        equation = res;
                        resolve(eq);
                    }
                };
            };

            errorFunc = function (reject) {
                return function (err) {
                    reject(new Error('Failed to get: ' + url +
                        " statusText: " + err.statusText +
                        " status: " + err.status
                        ));
                };
            };

            //Grab the equation
            retObj.equation = new Promise(function (resolve, reject) {
                $.ajax({
                    dataType: "text",
                    url: url,
                    success: successFunc(resolve, reject),
                    error: errorFunc(reject)
                });
            });
        }());

        //Global function definitions
        retObj.fit = fitEquation;

        retObj.race = function (array) {
            var promRet;
            if (array && array.length > 0) {
                promRet = Promise.all(array);
            } else {
                promRet = Promise.all(promises);
            }
            return promRet;
        };

        retObj.all = function (array) {
            var promRet;
            if (array && array.length > 0) {
                promRet = Promise.all(array);
            } else {
                promRet = Promise.all(promises);
            }
            return promRet;
        };

        retObj.url = url;
        retObj.then = function (x, y) {
            return retObj.equation.then(x, y);
        };
        retObj.catch = function (x) {
            return retObj.equation.catch(x);
        };

        return retObj;
    };


    return main;

}());