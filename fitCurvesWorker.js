/*global self: false */
/*jslint evil: true, todo: true */

// TODO: check user input...
//Container for all code. Will be run on load
(function () {
    'use strict';

    //variable declarations
    var fmincon, determineRunningConditions, binomialDict;

    //variable definitions

    //function definitions
    fmincon = (function () {
        //please note - this is a minimized version of fmincon from amdjs_1.1.0.js
        //variable declarations
        var binomialProb, combine, factorialDivide, factorial, sqrSumOfErrors, sqrSumOfDeviations, func, binomialFit;

        //variable defintions

        //function definitions
        func = function (fun, x0, X, y) {
            //variable definitions
            var corrIsh, itt, lastItter, options, parI, SSDTot, sse, SSETot, x1;

            //variable declarations
            options = {
                step: x0.map(function (s) {return s / 100; }),
                maxItt: 1000,
                minPer: 1e-6
            };
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
            return {parameters: x0, totalSqrErrors: SSETot, R2: corrIsh, binomFit: binomialFit(fun, X, y, x0)};
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

        binomialFit = function (fun, X, y, x0) {
            var i, res1, res2, count = 0, tot = y.length - 1;
            for (i = 0; i < tot; i += 1) {
                res1 = fun(X[i], x0) - y[i];
                res2 = fun(X[i + 1], x0) - y[i + 1];
                if (res1 * res2 <= 0) {
                    count += 1;
                }
            }

            return binomialProb(tot, count);
        };

        binomialProb = function (n, end) {
            var i, sol = 0, prob = 0.5; // Since this is my measure of goodness of fit, I set prob=0.5.

            //If it is predefined (should be for all in the standard data set)
            if (binomialDict.hasOwnProperty(n) && binomialDict[n].hasOwnProperty(end)) {
                return binomialDict[n][end];
            }

            //Else actually calculate it.
            for (i = 0; i <= end; i += 1) {
                sol += combine(n, i) * Math.pow(prob, n);
            }
            return sol;
        };

        combine = function (n, r) {
            return factorialDivide(n, Math.max(n - r, r)) / factorial(Math.min(n - r, r));
        };

        factorialDivide = function (top, bottom) {
            var i, sol = 1;
            if (top < bottom) {
                return NaN;
            }
            for (i = top; i > bottom; i += -1) {
                sol *= i;
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

        //return function
        return func;
    }());

    determineRunningConditions = function (object) {
        //variable declarations
        var i, X, xIni, yIni, length, equationObj;
        equationObj = eval('equationObj=' + object.equation.string);
        //variable defintions
        X = object.x_values;
        xIni = [];
        yIni = [];
        length = X.length;

        //determine what points are 'good'
        for (i = 0; i < length; i += 1) {
            if (object.accurateData[i]) {
                xIni.push([X[i]]); // This is to be used for the curve fitting
                yIni.push(object.y_values[i]);
            }
        }
        return {params: equationObj.setInitial(xIni, yIni), X: xIni, y: yIni, func: equationObj.func};
    };

    self.onmessage = function (event) {
        //variable declarations
        var result, runCond;
        //variable definitions
        runCond = determineRunningConditions(event.data[0]);

        result = fmincon(runCond.func, runCond.params, runCond.X, runCond.y);
        //return result
        self.postMessage([event.data[0], result]);
    };


    //This is the binomial presolved dictionary based on p=0.5 from n->i
    binomialDict = {"0": {"0": 1}, "1": {"0": 0.5, "1": 1}, "2": {"0": 0.25, "1": 0.75, "2": 1}, "3": {"0": 0.125, "1": 0.5, "2": 0.875, "3": 1}, "4": {"0": 0.0625, "1": 0.3125, "2": 0.6875, "3": 0.9375, "4": 1}, "5": {"0": 0.03125, "1": 0.1875, "2": 0.5, "3": 0.8125, "4": 0.96875, "5": 1}, "6": {"0": 0.015625, "1": 0.109375, "2": 0.34375, "3": 0.65625, "4": 0.890625, "5": 0.984375, "6": 1}, "7": {"0": 0.0078125, "1": 0.0625, "2": 0.2265625, "3": 0.5, "4": 0.7734375, "5": 0.9375, "6": 0.9921875, "7": 1}, "8": {"0": 0.00390625, "1": 0.03515625, "2": 0.14453125, "3": 0.36328125, "4": 0.63671875, "5": 0.85546875, "6": 0.96484375, "7": 0.99609375, "8": 1}, "9": {"0": 0.001953125, "1": 0.01953125, "2": 0.08984375, "3": 0.25390625, "4": 0.5, "5": 0.74609375, "6": 0.91015625, "7": 0.98046875, "8": 0.998046875, "9": 1}, "10": {"0": 0.0009765625, "1": 0.0107421875, "2": 0.0546875, "3": 0.171875, "4": 0.376953125, "5": 0.623046875, "6": 0.828125, "7": 0.9453125, "8": 0.9892578125, "9": 0.9990234375, "10": 1}, "11": {"0": 0.00048828125, "1": 0.005859375, "2": 0.03271484375, "3": 0.11328125, "4": 0.2744140625, "5": 0.5, "6": 0.7255859375, "7": 0.88671875, "8": 0.96728515625, "9": 0.994140625, "10": 0.99951171875, "11": 1}, "12": {"0": 0.000244140625, "1": 0.003173828125, "2": 0.019287109375, "3": 0.072998046875, "4": 0.19384765625, "5": 0.38720703125, "6": 0.61279296875, "7": 0.80615234375, "8": 0.927001953125, "9": 0.980712890625, "10": 0.996826171875, "11": 0.999755859375, "12": 1}};

}());
