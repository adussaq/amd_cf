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
|getEquation|[*function*] This function takes two arguments and returns one. Inputs: **eq_url** [*required, string, this is the address of .jsonp __equation_obj__, described below*] and a **ge_callback** function [*Not required, function, described below*]. Returns: __fitting_obj__ [*object*]|


###**fitting_obj**###
|Property|Description|
|---------------|----------------|
|fitEquation|[*function*] This function takes two arguments. Input: **data_obj** [*required, object, more information below*] and a **fe_callback** [*Not required, function, more information below*]. Return: via a **fit_res** to **fe_callback**[*object, described below*]|
|doneFitting|[*function*] This is takes one argument, a function [*required*], called asynchronously once all already submitted jobs have been completed. It can be called as many times as needed throughout the course of the code, however minimizing it will maximize the speed at which results are returned.|
|equation|[*equation*] This is the __equation_obj__ that is returned from the .jsonp url, editing it will **NOT** effect any downstream fitting, this is functionally a read only object.|
|url|[*string*] This is the url used to grab the .jsonp __equation_obj__|

###**Callback Functions**###
|Function|Description|
|---------------|----------------|
|ge_callback|This function is passed **equation_obj** [*object*] asynchronously.|
|fe_callback|This function is called once the fitting is completed, it is passed two objects: **fit_res** [*described below*] and the original **data_obj** cleaned of any functions that may have been added.|


###data_obj###
|Property|Description|
|---------------|----------------|
|x_values|[*required, 2D array of doubles*] X=[[x1],[x2],[x3]...[xn]], where y=f(X)*|
|y_values|[*required, 1D array of doubles*] y, where y=f(X)|
|fit_params|[*optional, object*] Described below, determines fitting conditions.|
|bool|[*optional, 1D array of booleans*] Length equivalent to that of X and y, labels each (X,y) point as viable data, digested to a true/false boolean|
|_other_|[*optional*] This may be any property you would like other than a function, it will be passed around with the data results.|

###equation_obj###
This is a complicated object, for a full example please see: https://github.com/adussaq/amd_cf/blob/gh-pages/simpleCubic.jsonp. This is required for every function type that is to be fit.

|Property|Description|
|---------------|----------------|
|**func|[*function, required*] This function must be set up to take two parameters: an X matrix (array of arrays) and a parameter vector. It should use these inputs to calculate a 'y' value and return a single number.|
|**setInitial|[*function, required*] This function must be set up to take the X matrix and the y array that will be used for the modeling, then utilize these components to determine the initial parameters for the fit.|
|**func_fit_params|[*object, optional*] This series of parameters describes the way all data passed into the fit function will be treated, more information below.|
|**string|[*string, protected*] This element contains the entirety of the jsonp article as a string. Do not try to store information in a property of the same name, it will be overwritten|
|**_other_|[*optional*] This may be any property you would like, it will be passed around with the data results.|

**Note: This cannot be set dynamically, this must be set utilizing the jsonp __equation_obj__ file.

###fit_params###
This optional object will overwrite the default and the func_fit_params when possible.

|Property|Description|
|---------------|----------------|
|maxItt|[*number, optional*] Maximum number of itterations before fitting is abandoned, must be an integer > 0 default: 1000|
|minPer|[*number, optional*] minimum percent change in sum of square deviations before fitting is considered complete, default: 1e-6|

###func_fit_params###
This optional object is set in a non dynamic fashion as part of the jsonp equation object. Elements by the same name that are declared in fit_params will be overwritten by the dynamically called fit_params object.

|Property|Description|
|---------------|----------------|
|**maxItt|[*number, optional*] Maximum number of itterations before fitting is abandoned, must be an integer > 0 default: 1000|
|**minPer|[*number, optional*] minimum percent change in sum of square deviations before fitting is considered complete, default: 1e-6|
|**step|[*function, optional*] This function should take the initial parameters array as determined by **equation_obj.setInitial** and return an array of initial steps. The default is to take the parameters and divide by 100, unless the parameter is 0 then 1e-3 is utilized as default|

**Note: this cannot be set dynamically, this must be set utilizing the jsonp __equation_obj__ file.

###fit_res###
|Property|Description|
|---------------|----------------|
|parameters|[*array*]|
|R2|[*number*]|
|WWtest|[*number*]|
|totalSqrErrors|[*number*]|
|success|[*number*] __Need to add this still...__ 0 if failure, otherwise this represents the itteration number at which the minimum solution was reached.|


##Minimal example of how to utilize tool.##
For a more flushed out version, please go to: https://alexdussaq.info/amd_cf/

    // Data set up
    var data = {
        x_values: [[1],[2],[3],[4],[5],[6],[7],[8],[9],[10]],
        y_values: [1.12, 7.78, 27.09, 63.83, 124.93, 215.86, 343.22, 511.86, 729.06, 1000.19],
    };

    //Get equation object (defined below)
    var eq_obj = amd_cf.getEquation('simpleCubic.jsonp');

    //Fits the data asynchronously
    eq_obj.fitEquation(data, function(res) {
        console.log('Done with data fit:', res);
    });

##simpleCubic.jsonp##
    {
        func: function (xVector, P) {
            return P[0] * Math.pow(xVector[0],3) + P[1];
        },
        setInitial: function (x_mat, y_vec) {
            var A = ( y_vec[1] - y_vec[0] ) / (Math.pow(x_mat[1][0], 3) - Math.pow(x_mat[0][0], 3));
            var B = y_vec[0] - A * Math.pow(x_mat[0][0], 3);
            return [A, B];
        }
    }

These modules were combined with the following visualization libraries: google chart tools (https://developers.google.com/chart/), jqmath (http://mathscribe.com/author/jqmath.html), and bootstrap (http://getbootstrap.com/) to create a tool to visualize individual curve fits for a unique biological data set. This is avaliable at http://kinome.github.io/demo-cf/#model.
