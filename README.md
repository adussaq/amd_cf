# amd_cf

For a thorough working example please go to: <a href="https://alexdussaq.info/amd_cf/">Test amd_cf</a> This is included as index.html in this directory.<br />
A simple example is shown <a href="https://github.com/adussaq/amd_cf#minimal-example-of-how-to-utilize-tool">below</a>.

This package allows for curve fitting (non-linear least squares regression) to be done within JavaScript Web Workers (<a href="https://github.com/adussaq/amd_ww">amd_ww</a>) with a series of simple commands. <br />This requires a number of files:
* amd_ww-2.0.0.min.js (<a href="https://github.com/adussaq/amd_ww">amd_ww</a>)
* jquery-2.1.4.min.js (jQuery)
* amd_cf_worker-1.2.1.min.js (This actually fits the data)
* .jseo (**J**ava**S**cript **E**quation **O**bject, an <a href="https://github.com/adussaq/amd_cf#equation_obj">**equation_obj**</a>)
* amd_cf-2.0.0.min.js (amd_cf, requires all of the above, does the work of running the curve fitting)

This heavily utilizes javascript promises. For more information on javascript promise please start with: <a href="http://www.html5rocks.com/en/tutorials/es6/promises/">HTML5 Rocks: Promises</a>

While not required for use <a href="https://github.com/adussaq/amd_core">amd_core</a> is recommended to insure promises are valid (automatically load promises polyfill as needed), jquery is loaded and that all packages are loaded in the correct order. If you choose not to utilize this then download the development version to edit the code accordingly.

###**amd_cf**###
|Property|Description|
|---------------|----------------|
|getEquation|[*function*] Inputs: **eq_url** [*required, string], the address of the .jseo <a href="https://github.com/adussaq/amd_cf#equation_obj">__equation_obj__</a>.  Return: <a href="https://github.com/adussaq/amd_cf#fitting_obj">__fitting_obj__</a> [*object*] the thenable promise object responsible for starting jobs.|


###**fitting_obj**###
This object inherits all properties from Promise with a few tweaks as well as the 'then' and 'catch' functions of the equation promise. For more on promises try starting here: <a href="http://www.html5rocks.com/en/tutorials/es6/promises/">HTML5 Rocks: Promises</a>

|Property|Description|
|---------------|----------------|
|fit|[*function*] Input: <a href="https://github.com/adussaq/amd_cf#data_obj">**data_obj**</a>[*required, object*]. Return: Thenable promise being passed <a href="https://github.com/adussaq/amd_cf#fit_res">**fit_res**</a>|
|all|[*function*] Takes one argument, an array [*optional*], this will be called asynchronously once all jobs in the array have been completed. If an array is not provided then it will utilize all jobs previously submitted using this object, all failed jobs return undefined in this case (If utilizing with an array, then any uncaught errors will not allow this function to continue). This returns a thenable promise.|
|race|[*function*] Takes one argument, an array [*optional*], this will be called asynchronously once any of the jobs in the array have been completed successfully. If an array is not provided then it will utilize all jobs previously submitted using this object. It returns a thenable promise. |
|equation|[*object, promise*] This is the thenable promise of the <a href="https://github.com/adussaq/amd_cf#equation_obj">__equation_obj__</a> that is returned from the .jseo file. Then is passed the equation object itself. NOTE: Editing any component of this will **NOT** affect any downstream fitting, this is essentially read only.|
|then|[*function*] This is the then function for **fitting_obj.equation**, shortcut here for ease of use.|
|catch|[*function*] This is the catch function for **fitting_obj.equation**, shortcut here for ease of use.|
|url|[*string*] This is the url used to grab the .jseo <a href="https://github.com/adussaq/amd_cf#equation_obj">__equation_obj__</a>|

###data_obj###
|Property|Description|
|---------------|----------------|
|x_values|[*required, 2D array of doubles*] X=[[x1],[x2],[x3]...[xn]], where y=f(X)*|
|y_values|[*required, 1D array of doubles*] y, where y=f(X)|
|fit_params|[*optional, object*] Described below, determines fitting conditions.|
|bool|[*optional, 1D array of booleans*] Length equivalent to that of X and y, labels each (X,y) point as viable data, digested to a true/false boolean|
|_other_|[*optional*] This may be any property you would like other than a function, it will be passed around with the data results.|

###equation_obj###
This can be a complicated object, for a full example please see: <a href="https://github.com/adussaq/amd_cf/blob/gh-pages/simpleCubic.jseo">simpleCubic.jseo</a>. For a simple example please see below. This is required for every function type that is to be fit.

|Property|Description|
|---------------|----------------|
|**func|[*function, required*] This function must be set up to take two parameters: an X matrix (array of arrays) and a parameter vector. It should use these inputs to calculate a 'y' value and return a single number.|
|**setInitial|[*function, required*] This function must be set up to take the X matrix and the y array that will be used for the modeling, then utilize these components to determine the initial parameters for the fit.|
|**func_fit_params|[*object, optional*] This series of parameters describes the way all data passed into the fit function will be treated, more information below.|
|**_other_|[*optional*] This may be any property you would like, it will be passed around with the data results.|

**Note: This cannot be set dynamically, this must be set utilizing the jseo __equation_obj__ file.

###fit_params###
This optional object will overwrite the default and the <a href="https://github.com/adussaq/amd_cf#func_fit_params">func_fit_params</a> when avaliable.

|Property|Description|
|---------------|----------------|
|maxItt|[*number, optional*] Maximum number of itterations before fitting is abandoned, must be an integer > 0 default: 1000|
|minPer|[*number, optional*] minimum percent change in sum of square deviations before fitting is considered complete, default: 1e-6|
|checkItt|[*number, optional*] Cycle for which the minPer is checked, default: 3. [*Ex: For the default every 3rd cycle the change in sum of square errors is compared to the sum of square errors calculated 3 cycles ago, if this is less than minPer the fitting is completed.*]|
|converge|[*number, optional*] This is the slope with which the steps change when the steps are moving the model in the correct direction. Default: 1.2|
|diverge|[*number, optional*] This is the slope with which the steps change when the steps are moving the model in the incorrect direction. Default: -0.5|

###func_fit_params###
This optional object is set in a non dynamic fashion as part of the jseo equation object. Elements by the same name that are declared in fit_params will be overwritten by the dynamically called <a href="https://github.com/adussaq/amd_cf#fit_params">fit_params</a> object.

|Property|Description|
|---------------|----------------|
|**_general_|[*N/A, optional*] All parameters described by <a href="https://github.com/adussaq/amd_cf# ">__fit_params__</a> can be assigned here, these can not be dynamically changed and will be overwritten by <a href="https://github.com/adussaq/amd_cf#fit_params">__fit_params__</a> if utilized in the same fit.|
|**step|[*function, optional*] This function should take the initial parameters array as determined by **equation_obj.setInitial** and return an array of initial steps. The default is to take the parameters and divide by 100, unless the parameter is 0 then 1e-3 is utilized as default|

**Note: this cannot be set dynamically, this must be set utilizing the jseo <a href="https://github.com/adussaq/amd_cf#equation_obj">__equation_obj__</a> file.

###fit_res###
|Property|Description|
|---------------|----------------|
|parameters|[*array*] The solution for the fit.|
|R2|[*number*] R squared calculation for fit.|
|WWtest|[*number*] Wald–Wolfowitz runs test, describes the non-parametric randomness of the residuals. For more information: <a href="https://en.wikipedia.org/wiki/Wald%E2%80%93Wolfowitz_runs_test.">Wald Wolfowitz Runs Test</a>.|
|totalSqrErrors|[*number*] The sum of the square of errors for the fit.|
|success|[*number*] 0 if failure, otherwise this represents the itteration number at which the minimum solution was reached, note that all values are divisible by __*checkItter*__ from __fit_params__ or __func_fit_params__ (default: 3).|
|data|[object] Original data used for fitting. Adds <a href="https://github.com/adussaq/amd_cf#equation_obj">__equation_obj__</a> and bool [*array*] which indicates all points are good if it was not previously defined.|
|ops|[object] The fitting parameters [*<a href="https://github.com/adussaq/amd_cf#fit_params">fit_params</a>*] used for fitting the data.|


##Minimal example of how to utilize tool.##
For a more flushed out version, or to try this code yourself, please go to: <a href="https://alexdussaq.info/amd_cf/">Test amd_cf</a>

    // Data set up
    var data = {
        x_values: [[1],[2],[3],[4],[5],[6],[7],[8],[9],[10]],
        y_values: [1.12, 7.78, 27.09, 63.83, 124.93, 215.86, 343.22, 511.86, 729.06, 1000.19],
    };

    //Get equation object (defined below)
    var eq_obj = amd_cf.getEquation('simpleCubic.jseo');

    //Fits the data asynchronously
    eq_obj.fit(data).then(function(res) {
        console.log('Done with data fit:', res);
    });

##simpleCubic.jseo##
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

These modules were combined with the following visualization libraries:  <a href="https://developers.google.com/chart/">Google Chart Tools</a>), <a href="http://mathscribe.com/author/jqmath.html">jqmath</a>, and <a href="http://getbootstrap.com/">bootstrap</a> to create a tool to visualize individual curve fits for a unique biological data set. This is avaliable at <a href="http://kinome.github.io/demo-cf/#model">CF Real Life Demonstration</a>.
