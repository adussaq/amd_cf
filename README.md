# amd_cf - This manual is a work in Progress

For a working example please go to: https://alexdussaq.info/amd_cf/<br />
The same example is shown below and is included as index.html in this directory.

This package allows for curve fitting to be done within JavaScript Web Workers (https://github.com/adussaq/amd_ww/) with a series of simple commands. <br />This requires a number of files:
* workersPackage.js (amd_ww)
* jquery-2.1.4.min.js (jQuery)
* .jsonp (An **equation_obj**, described below)
* fitCurves.js (amd_cf, requires all of the above, does the work of running the curve fitting)

###**amd_cf**###
|Property|Description|
|---------------|----------------|
|getEquation|[*function*] This function takes two arguments, **eq_url** [*required, string, this is the address of .jsonp __equation_obj__, more information below*] and a **ge_callback** function [*Not required, function, however equation is grabbed asynchronously so it is smart to use this callback.*]|j
|fitEquation|[*function*] This function takes two arguments, **data_obj** [*required, object, more information below*] and a **fe_callback** [*Not required, function, more information below*]|
|doneFitting|[*function*] This is takes one argument, a function [*required*], called asynchronously once all already submitted jobs have been completed. It can be called as many times as needed throughout the course of the code, however minimizing it will maximize the speed at which results are returned.|

###**Callback Functions**###
|Function|Description|
|---------------|----------------|
|ge_callback|This function is passed **equation_obj** [*object*] asynchronously.|
|fe_callback|This function is called once the fitting is completed, it is passed two objects: **cf_res** [*described below*] and the original **data_obj** cleaned of functions.|


###data_obj###
|Property|Description|
|---------------|----------------|
|equation_obj|[*required, object*] This is the object passed into the callback function for **getEquation*** and is described further below.
|x_values|[*required, 2D array of doubles*] X=[[x1],[x2],[x3]...[xn]], where y=f(X)*|
|y_values|[*required, 1D array of doubles*] y, where y=f(X)|
|fit_params|[*optional, object*] Described below, determines fitting conditions*]
|bool|[*optional, 1D array of booleans*] Length equivalent to that of X and y, labels each (X,y) point as viable data, digested to a true/false boolean|

###equation_obj###
This is a complicated object, for a full example please see: https://github.com/adussaq/amd_cf/blob/gh-pages/simpleCubic.jsonp. This is required for every function type that is to be fit.

|Property|Description|
|---------------|----------------|
|**func|[*function, required*] This function must be set up to take two parameters: an X matrix (array of arrays) and a parameter vector. It should use these inputs to calculate a 'y' value and return a single number.|
|**setInitial|[*function, required*] This function must be set up to take the X matrix and the y array that will be used for the modeling, then utilize these components to determine the initial parameters for the fit.|
|func_fit_params|[*object, optional*] This series of parameters  |

**Note: this cannot be set dynamically, doing so will just have them reset to the original form for the actual fitting process. This is due to the way functions are passed into web workers.

###fit_params###
This optional object will overwrite the default and the func_fit_params when possible.

|Property|Description|
|---------------|----------------|
|maxItt|[*integer, optional*] Maximum number of itterations before fitting is abandoned, default: 1000|
|minPer|[*float, optional*] minimum percent change in sum of square deviations before fitting is considered complete, default: 1e-6|

###func_fit_params###
This optional object is set in a non dynamic fashion as part of the jsonp equation object. Elements by the same name that are declared in fit_params will be overwritten by the dynamically called fit_params object.

|Property|Description|
|---------------|----------------|
|maxItt|[*integer, optional*] Maximum number of itterations before fitting is abandoned, default: 1000|
|minPer|[*float, optional*] minimum percent change in sum of square deviations before fitting is considered complete, default: 1e-6|
|**step|[*function, optional*] This function should take the initial parameters array as determined by **equation_obj.setInitial** and return an array of initial steps. The default is to take the parameters and divide by 100, unless the parameter is 0 then 1e-3 is utilized as default|

**Note: this cannot be set dynamically, doing so will just have them reset to the original form for the actual fitting process. This is due to the way functions are passed into web workers.


##Example of how to utilize tool.##
    // Data set up
       var X = [[1],[2],[3],[4],[5],[6],[7],[8],[9],[10]];
       var y1 = [1.47, 8.14, 27.13, 64.04, 125.39, 216.4, 343.46, 512.01, 729.11, 1000.15];
       var y2 = [5.359999999999999, 19.28, 57.02, 131.27, 253.42, 435.37, 689.03, 1027.21, 1461.43, 2003.44];
       
    var data1 = {
        x_values: X,
        y_values: y1,
        equation: eq,
    };

    var data2 = {
        x_values: X,
        y_values: y2,
        equation: eq,
    };

	var eq_obj = amd_cf.getEquation('simpleCubic.jsonp');

	//Fits the data asynchronously
	eq_obj.fitEquation(data1, function(res, cleanOriginData) {
		//cleanOriginData is the data with all functions removed
		console.log('Done With 1', res);
	});

	//Fits the data asynchronously
	eq_obj.fitEquation(data2, function(res, cleanOriginData) {
		//cleanOriginData is the data with all functions removed
		console.log('Done With 2', res);
	});

	// If a lot of fits are called, this will be called once all fitting is completed
	eq_obj.doneFitting(function() {
		console.log('Done With All!');
	});

##simpleCubic.jsonp##
    {
        stringified: 'a * x ^ 3 + b',
        func: function (xVector, P) {
            return P[0] * Math.pow(xVector[0],3) + P[1];
        },
        setInitial: function (x_mat, y_vec) {
            // For other data, this must be made more intelligent
            var A = ( y_vec[1] - y_vec[0] ) / (Math.pow(x_mat[1][0], 3) - Math.pow(x_mat[0][0], 3));
            var B = y_vec[0] - A * Math.pow(x_mat[0][0], 3);

            return [A, B];
        },
        description: 'For fitting two parameter Ax^3+B cubic function'
    }

These modules were combined with the following visualization libraries: google chart tools (https://developers.google.com/chart/), jqmath (http://mathscribe.com/author/jqmath.html), and bootstrap (http://getbootstrap.com/) to create a tool to visualize individual curve fits for a unique biological data set. This is avaliable at http://kinome.github.io/demo-cf/#model.
