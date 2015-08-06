# amd_cf - This manual is a work in Progress

For a working example please go to: https://alexdussaq.info/amd_cf/
The same example is shown below and is included as index.html in this directory.

This package allows for curve fitting to be done within JavaScript Web Workers (https://github.com/adussaq/amd_ww/) with a series of simple commands. This requires a number of files:
* workersPackage.js (amd_ww)
* jquery-2.1.4.min.js (jQuery)
* .json (An equation outline file)
* fitCurves.js (amd_cf, requires all of the above, does the work of running the curve fitting)

###**Get Equation**###
|Function|Description|
|---------------|----------------|
|getEquation|This function takes two arguments, **eq_url** [*required, this is the address of .json __equation_object__, more information below*] and a **ge_callback** function [*Not required, however equation is grabbed asynchronously so it is smart to use this callback.*]|
|ge_callback|This function is passed the equation_object asynchronously.|

###**Fit Equation**###
|Function|Description|
|---------------|----------------|
|fitEquation|This function takes two arguments, **data_obj** [*required, more information below*] and a **fe_callback** [*Not required, function, more information below*]|
|fe_callback|This function is called once the fitting is completed, it is passed two objects: **cf_res** [*described below*] and **data_obj**|
|doneFitting|This is takes one argument, a function [*required*], called asynchronously once all already submitted jobs have been completed. It can be called as many times as needed throughout the course of the code, however minimizing it will maximize the speed at which results are returned.|

###data_obj###
|Property|Description|
|---------------|----------------|
|equation_object|[*required, object*] This is the object passed into the callback function for **getEquation*** and is described further below.
|x_values|[*required, 2D array of doubles*] X=[[x1],[x2],[x3]...[xn]], where y=f(X)*|
|y_values|[*required, 1D array of doubles*] y, where y=f(X)|
|fit_params|[*optional, object*] Described below, determines fitting conditions*]
|bool|[*optional, 1D array of booleans*] Length equivalent to that of X and y, labels each (X,y) point as viable data, digested to a true/false boolean|

###equation_object###
|Property|Description|
|---------------|----------------|
|step|[*optional*] function to determine stepping for curve fitting parameters ... |

###fit_params###
|Property|Description|
|---------------|----------------|
|maxItt|[*integer*] Maximum number of itterations before fitting is abandoned, default: 1000|
|minPer|[*float*] minimum percent change in sum of square deviations before fitting is considered complete, default: 1e-6|

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



    /* This is done asynchronously, start by grabbing your function of interest */
    amd_cf.getEquation('simpleCubic.json', function(eq) {
        //Now fit the data you have already set up
        //Fits the data asynchronously
        amd_cf.fitEquation(data1, function(res, cleanOriginData) {
            //cleanOriginData is the data with all functions removed
            console.log('Done With 1', res);
        });

        //Fits the data asynchronously
        amd_cf.fitEquation(data2, function(res, cleanOriginData) {
            //cleanOriginData is the data with all functions removed
            console.log('Done With 2', res);
        });

        //Once you have no more fits to perform, call this function, it will run when both of the above are completed.
        // If a lot of fits are called, this will be called once all fitting is completed
        amd_cf.doneFitting(function() {
            console.log('Done With All!');
        });
        
    });

##simpleCubic.json##
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

These modules were combined with the following visualization libraries: google chart tools (https://developers.google.com/chart/), jqmath (http://mathscribe.com/author/jqmath.html), bootstrap (http://getbootstrap.com/) and jquery (http://jquery.com/) to create a tool to visualize individual curve fits for a unique biological data set. This is avaliable at http://kinome.github.io/demo-cf/#model.
