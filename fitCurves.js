/*global self, window, Math, amd_cf*/
/*jslint todo: true evil:true */

var amd_cf = (function () {
    'use strict';
    var isArray, main, $, checkjQ, workerScript, checkdata, gotten, createRetObj;

    //Note: This indicates that this package and fitCurvesWorkers must be in the same
    // Directory, if they are not, this location needs to be changed...
    workerScript = 'fitCurvesWorker.js';
    main = {};
    gotten = {};

    isArray = (function () {
        // Use compiler's own isArray when available
        if (Array.isArray) {
            return Array.isArray;
        }

        // Retain references to variables for performance
        // optimization
        var objectToStringFn = Object.prototype.toString,
            arrayToStringResult = objectToStringFn.call([]);

        return function (subject) {
            return objectToStringFn.call(subject) === arrayToStringResult;
        };
    }());

    checkjQ = function () {
        var ret;
        if (window.jQuery) {
            $ = window.jQuery;
            ret = true;
        } else {
            console.error('jQuery is required for this add on package.');
            ret = false;
        }
        return ret;
    };

    checkdata = function (data) {
        var ret = true;
        if (!data.hasOwnProperty('x_values')) {
            console.error('Must inlcude x_values as an property on data');
            ret = false;
        }
        if (!data.y_values) {
            console.error('Must inlcude y_values as an property on data');
            ret = false;
        }
        if (ret) {
            if (!isArray(data.x_values) || !isArray(data.y_values)) {
                console.error('Both x_values and y_values must be arrays');
                ret = false;
            }
            if (ret && data.x_values.length !== data.y_values.length) {
                console.error('The length of x_values and y_values must be the same');
                ret = false;
            }
            if (!isArray(data.x_values[0])) {
                console.error('data.x_values must be an array of arrays, each array represents the X vector for each point.');
                ret = false;
            }
//             if (!data.hasOwnProperty('equation') || typeof data.equation !== 'object' || !data.equation.loaded) {
//                 console.error('Equation must be loaded using "getEquation" function first');
//                 ret = false;
//             }
        }
        return ret;
    };

    main.getEquation = function (url, callback) {
        var ret;
        if (checkjQ()) {
            if (!callback || typeof callback !== 'function') {
                console.warn('Callback function should be defined and utilized, this is done asynchronously.');
                callback = function (eq) {
                    console.log('equation loaded', eq);
                };
            }
            //Return an object with fit equations and done fitting equations attached.
            ret = createRetObj(url, callback);
        } else {
            ret = false;
        }
        return ret;
    };

    createRetObj = function (url, callback) {
        var retObj, fitEquation, doneFitting, worker, checkWW, obj_eq;

        retObj = {};
        obj_eq = {};
        obj_eq.eq = {}; // This is to pass things by reference

        fitEquation = function (data, callback) {
            if (checkdata(data)) {
                //Sanitizes data, this has to be done for web workers
                data.equation = obj_eq.eq;
                data = JSON.parse(JSON.stringify(data));
                worker.submitJob(data, function (res) {
                    //This will return the results of the analysis and the original data
                    callback(res.data[1], res.data[0]);
                });
            }
        };

        checkWW = function () {
            var ret;
            if (window.amd_ww) {
                worker = window.amd_ww.startWorkers({filename: workerScript});
                worker.pause();
                checkWW = function () {
                    return true;
                };
                ret = true;
            } else {
                throw 'amd_ww is required for this curve fitting, download at: https://github.com/adussaq/amd_ww/';
            }
            return ret;
        };

        doneFitting = function (callback) {
            if (!callback || typeof callback !== 'function') {
                console.error('Callback function should be defined and utilized, this is done asynchronously.');
                callback = function () {
                    console.log('All fitting completed!');
                };
            }
            worker.onComplete(callback);
        };

        checkWW();
        //set out ajax call as needed for url
        if (gotten[url]) {
            retObj.equation = gotten[url];
            obj_eq.eq = gotten[url];
            worker.resume();
            callback(gotten[url]);
        } else {
            $.ajax({
                dataType: "json",
                url: url,
                complete: function (res) {
                    var eq;
                    eq = {};
                    eval('eq = ' + res.responseText);
                    eq.string = res.responseText;
                    eq.loaded = true;
                    gotten[url] = eq;
                    retObj.equation = eq;
                    obj_eq.eq = eq;
                    worker.resume();
                    callback(eq);
                }
            });
        }

        retObj.fitEquation = fitEquation;
        retObj.doneFitting = doneFitting;
        retObj.url = url;


        return retObj;

    };


    return main;

}());