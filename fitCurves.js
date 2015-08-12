/*global self, window, Math, amd_cf*/
/*jslint todo: true evil:true */

var amd_cf = (function () {
    'use strict';
    var isArray, checkEquation, main, $, checkWW, checkjQ, workerScript, checkdata, gotten, worker, createRetObj;

    //Note: This indicates that this package and fitCurvesWorkers must be in the same
    // Directory, if they are not, this location needs to be changed...
    workerScript = 'fitCurvesWorker.js';
    main = {};
    gotten = {};


    checkEquation = function (eq, url) {
        if (!eq || typeof eq !== 'object') {
            throw 'Equation object at ' + url + ' is not an object, see: https://github.com/adussaq/amd_cf/blob/gh-pages/README.md#equation_obj for more information.';
        }
        if (!eq.hasOwnProperty('func') || typeof eq.func !== 'function') {
            throw 'Equation object at ' + url + ' does not have a proper ".func" property, see: https://github.com/adussaq/amd_cf/blob/gh-pages/README.md#equation_obj for more information.';
        }
        if (!eq.hasOwnProperty('setInitial') || typeof eq.setInitial !== 'function') {
            throw 'Equation object at ' + url + ' does not have a proper ".setInitial" property, see: https://github.com/adussaq/amd_cf/blob/gh-pages/README.md#equation_obj for more information.';
        }
    };

    checkWW = function () {
        var ret;
        if (window.amd_ww) {
            worker = window.amd_ww.startWorkers({filename: workerScript});
            checkWW = function () {
                return true;
            };
            ret = true;
        } else {
            throw 'amd_ww is required for this curve fitting, download at: https://github.com/adussaq/amd_ww/';
        }
        return ret;
    };

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
            throw 'jQuery is required for this add on package.';
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
        }
        return ret;
    };

    main.getEquation = function (url, callback) {
        var ret;
        //Make sure jquery is loaded, this is for grabbing the equation, their AJAX is much more advanced than what I wish to write.
        if (checkjQ()) {
            if (!callback || typeof callback !== 'function') {
                callback = function (eq) {
                    return eq;
                };
            }
            //Return an object with fit equations and done fitting equations attached.
            ret = createRetObj(url, callback);
        }
        return ret;
    };

    createRetObj = function (url, callback) {
        //Variable Declarations
        var retObj, fitEquation, doneFitting, equation, evaleq, assignToEq;

        //Variable Definitions
        retObj = {};
        equation = {}; // This is to pass things by reference

        //Function Definitions
        assignToEq = function (obj) {
            var myprop;
            for (myprop in obj) {
                if (obj.hasOwnProperty(myprop)) {
                    equation[myprop] = obj[myprop];
                }
            }
        };

        fitEquation = function (data, callback) {
            if (checkdata(data)) {
                data.equation = equation;
                worker.submitJob(data, function (res) {
                    var originData;
                    //This will return the results of the analysis and the original data
                    originData = res.data[0];
                    delete originData.equation; //return origin data to its original state

                    callback(res.data[1], originData);
                });
            }
        };

        doneFitting = function (callback) {
            if (!callback || typeof callback !== 'function') {
                console.error('Callback function should be defined and utilized, this is done asynchronously.');
                callback = function () {
                    console.log('All fitting completed!');
                };
            }
            worker.wait(callback);
        };

        evaleq = function (str) {
            var eq = {};
            eval('eq = ' + str);
            eq.string = str;
            return eq;
        };

        //Do the actual work of the function.
        (function () {
            //Check if workers have started, pause them.
            checkWW();
            worker.pause();

            //Grab the result, if the url has already been resolved
            if (gotten[url]) {
                //Assign by property so it is passed by reference
                assignToEq(gotten[url][0]);
                retObj.equation = gotten[url][1];
                worker.resume(); // unpause the worker queue
                callback(gotten[url][1]);

            //If it has not been, then send the ajax command
            } else {
                $.ajax({
                    dataType: "json",
                    url: url,
                    complete: function (res) {
                        var eq1, eq2;
                        //I have two so the local equation cannot be changed by editing the returned one.
                        eq1 = evaleq(res.responseText);
                        eq2 = evaleq(res.responseText);
                        checkEquation(eq1, url); //This will throw an error as needed
                        gotten[url] = [eq1, eq2];

                        //Assign by property so it is passed by reference
                        assignToEq(eq1);

                        //These are the same, however editing them will not effect eq1
                        retObj.equation = eq2;
                        worker.resume(); // unpause the worker queue
                        callback(eq2);
                    }
                });
            }

            retObj.fitEquation = fitEquation;
            retObj.doneFitting = doneFitting;
            retObj.url = url;
        }());

        return retObj;
    };


    return main;

}());