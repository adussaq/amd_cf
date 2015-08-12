/*global self, Math*/
/*jslint evil: true, todo: true */

// TODO: check user input...
//Container for all code. Will be run on load
(function () {
    'use strict';

    //variable declarations
    var fmincon, determineRunningConditions, runsTest;

    //variable definitions

    //function definitions
    fmincon = (function () {
        //please note - this is a minimized version of fmincon from amdjs_1.1.0.js
        //variable declarations
        var sqrSumOfErrors, sqrSumOfDeviations, func;

        //variable defintions

        //function definitions
        func = function (fun, x0, X, y, options) {
            //variable definitions
            var corrIsh, itt, lastItter, parI, SSDTot, sse, SSETot, x1, success;

            //variable declarations
            options = typeof options === 'object' ? options : {};
            options.step = options.step || x0.map(function (s) {return s / 100; });
            options.maxItt = options.maxItt || 1000;
            options.minPer = options.minPer || 1e-6;
            lastItter = Infinity;
            x1 = JSON.parse(JSON.stringify(x0));

            //Actually begin looping through all the data
            for (itt = 0; itt < options.maxItt; itt += 1) {

                //Go through all the parameters
                for (parI in x1) {
                    if (x1.hasOwnProperty(parI)) {
                        x1[parI] += options.step[parI];
                        if (sqrSumOfErrors(fun, X, y, x1) < sqrSumOfErrors(fun, X, y, x0)) {
                            x0[parI] = x1[parI];
                            options.step[parI] *= 1.2;
                        } else {
                            x1[parI] = x0[parI];
                            options.step[parI] *= -0.5;
                        }
                    }
                }

                //make it so it checks every 3 rotations for end case
                if ((itt % 3) === 0) {
                    sse = sqrSumOfErrors(fun, X, y, x0);
                    if (Math.abs(1 - sse / lastItter) < options.minPer) {
                        break;
                    }
                    lastItter = sse;
                }
            }

            //I added the following 'R^2' like calculation.
            SSDTot = sqrSumOfDeviations(y);
            SSETot = sqrSumOfErrors(fun, X, y, x0);
            corrIsh = 1 - SSETot / SSDTot;

            //Check if fitting converged
            success = itt;
            if (itt === options.maxItt && Math.abs(1 - SSETot / lastItter) > options.minPer) {
                success = 0;
            }
            return {v: 1, initParams: {mI: options.maxItt, mpC: options.minPer, pC: Math.abs(1 - SSETot / lastItter) }, success: success, parameters: x0, totalSqrErrors: SSETot, R2: corrIsh, WWtest: runsTest(fun, X, y, x0)};
        };

        sqrSumOfErrors = function (fun, X, y, x0) {
            //variable declarations
            var error = 0, i, n = X.length;
            for (i = 0; i < n; i += 1) {
                error += Math.pow(fun(X[i], x0) - y[i], 2);
            }
            return error;
        };

        sqrSumOfDeviations = function (y) {
            //variable declarations
            var avg, error, length, i;
            //variable definitions
            error = 0;
            avg = 0;
            length = y.length;
            //find average
            for (i = 0; i < length; i += 1) {
                avg += y[i];
            }
            avg = avg / length;
            //find ssd
            for (i = 0; i < length; i += 1) {
                error += Math.pow(y[i] - avg, 2);
            }
            return error;
        };


        //return function
        return func;
    }());

    determineRunningConditions = function (object) {
        //variable declarations
        var options, options2, i, X, xIni, yIni, length, equationObj, hasBool, p, initParams;
        equationObj = eval('equationObj=' + object.equation.string);
        //variable defintions
        X = object.x_values;
        xIni = [];
        yIni = [];
        length = X.length;
        hasBool = true;

        //check if bool exits
        if (!object.hasOwnProperty('bool')) {
            hasBool = false;
            object.bool = [];
        }

        //determine what points are 'good'
        for (i = 0; i < length; i += 1) {
            if (hasBool) {
                if (object.bool[i]) { // This exists if 'accurate data' is being determined
                    xIni.push([X[i]]); // This is to be used for the curve fitting
                    yIni.push(object.y_values[i]);
                }
            } else {
                object.bool.push(1);
                xIni.push([X[i]]);
                yIni.push(object.y_values[i]);
            }

        }

        //Check for fitting parameters
        options = equationObj.func_fit_params || {};
        options2 = object.fit_params || {};
        for (p in options2) {
            if (options2.hasOwnProperty(p)) {
                options[p] = options2[p];
            }
        }

        //Determine start conditions
        initParams = equationObj.setInitial(xIni, yIni);
        //Run step function if it exits
        if (options.hasOwnProperty('step')) {
            if (typeof options.step === 'function') {
                options.step = options.step(initParams);
            } else {
                delete options.step; // If it is not a function, then it needs to be returned to no value
            }
        }

        return {fit_params: options, params: equationObj.setInitial(xIni, yIni), X: xIni, y: yIni, func: equationObj.func};
    };

    runsTest = (function () {
        var main, combineDict, runsPDF, factorial, factorialDivide, combine;

        main = function (func, X, y, p0) {
            //Variable declaration
            var i, signC, signL, counts, typeRuns, current, tot;

            //Variable assignment
            counts = [1, 0];
            typeRuns = [1, 0];
            current = 0;
            tot = X.length;

            //Count the number of switches and runs of (-) versus (+)
            //Note since runs(n1, n2, r) == runs(n2, n1, r) it is not important the direction, just the number of switches
            //Initialize the 'last' sign, actual - predicted
            signL = y[0] - func(X[0], p0);
            for (i = 1; i < tot; i += 1) {
                //Calculate this sign actual - predicted
                signC = y[i] - func(X[i], p0);

                if (signC * signL <= 0) { // This means if the model is ever perfect, it counts as a switch
                    //Switch current from 0->1 or 1->0
                    current = (current + 1) % 2;

                    //Increment the number of runs for this type, note type '0' began with 1
                    typeRuns[current] += 1;
                }
                //Current count incriment, reasign the 'last' sign
                counts[current] += 1;
                signL = signC;

            }

            //Actually calculate the runs PDF
            return runsPDF(counts[0], counts[1], typeRuns[0] + typeRuns[1]);
        };

        runsPDF = function (n1, n2, r) {
            var sol;
            if (r < 2) { // This only works for r >= 2.
                sol = 0;
            } else if (r % 2) { // odd
                sol = (combine(n1 - 1, (r - 1) / 2) * combine(n2 - 1, (r - 3) / 2) + combine(n1 - 1, (r - 3) / 2) * combine(n2 - 1, (r - 1) / 2)) / combine(n1 + n2, n1);
            } else { //even
                sol = 2 * combine(n1 - 1, r / 2 - 1) * combine(n2 - 1, r / 2 - 1) / combine(n1 + n2, n1);
            }
            return sol;
        };

        combine = function (n, r) {
            var sol;
            if (r > n) {
                sol = 0;
            } else if (combineDict.hasOwnProperty(n)) {
                if (combineDict[n].hasOwnProperty(r)) {
                    sol = combineDict[n][r];
                }
            } else {
                sol = factorialDivide(n, Math.max(n - r, r)) / factorial(Math.min(n - r, r));
            }
            return sol;
        };

        factorial = function (x) {
            var ret = 1, i;
            if (x >= 1) {
                for (i = x; i > 1; i -= 1) {
                    ret = ret * i;
                }
            }
            return ret;
        };

        factorialDivide = function (top, bottom) {
            var i, sol = 1;
            //Note: By the nature of previous screening the top >= bottom, however this will not work without
                // dealing with the opposite posibility if migrated to other locations
            for (i = top; i > bottom; i += -1) {
                sol *= i;
            }
            return sol;
        };


        //This is the presolved combination dictionary from 1->13, the limit of my use for this, could easily be expanded, however it will increase load time.
        combineDict = { 1: { 0: 1, 1: 1 }, 2: { 0: 1, 1: 2, 2: 1 }, 3: { 0: 1, 1: 3, 2: 3, 3: 1 }, 4: { 0: 1, 1: 4, 2: 6, 3: 4, 4: 1 }, 5: { 0: 1, 1: 5, 2: 10, 3: 10, 4: 5, 5: 1 }, 6: { 0: 1, 1: 6, 2: 15, 3: 20, 4: 15, 5: 6, 6: 1 }, 7: { 0: 1, 1: 7, 2: 21, 3: 35, 4: 35, 5: 21, 6: 7, 7: 1 }, 8: { 0: 1, 1: 8, 2: 28, 3: 56, 4: 70, 5: 56, 6: 28, 7: 8, 8: 1 }, 9: { 0: 1, 1: 9, 2: 36, 3: 84, 4: 126, 5: 126, 6: 84, 7: 36, 8: 9, 9: 1 }, 10: { 0: 1, 1: 10, 2: 45, 3: 120, 4: 210, 5: 252, 6: 210, 7: 120, 8: 45, 9: 10, 10: 1 }, 11: { 0: 1, 1: 11, 2: 55, 3: 165, 4: 330, 5: 462, 6: 462, 7: 330, 8: 165, 9: 55, 10: 11, 11: 1 }, 12: { 0: 1, 1: 12, 2: 66, 3: 220, 4: 495, 5: 792, 6: 924, 7: 792, 8: 495, 9: 220, 10: 66, 11: 12, 12: 1 }, 13: { 0: 1, 1: 13, 2: 78, 3: 286, 4: 715, 5: 1287, 6: 1716, 7: 1716, 8: 1287, 9: 715, 10: 286, 11: 78, 12: 13, 13: 1 } };

        return main;
    }());

    self.onmessage = function (event) {
        //variable declarations
        var result, runCond;
        //variable definitions
        runCond = determineRunningConditions(event.data);
        result = fmincon(runCond.func, runCond.params, runCond.X, runCond.y, runCond.fit_params);
        //return result
        self.postMessage([event.data, result]);
    };

}());
