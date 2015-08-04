# amd_cf
Non-linear curve fitting in javascript. Built to utilize javascript web workers via amd_ww (https://github.com/adussaq/amd_ww/).

For a working example please go to: https://alexdussaq.info/amd_cf/

Will flush out readme with specific instructions and transfer a small working example here.



The curve fitting module (see Methods) works with any y=f(X) where y is the dependent variable and X is an independent vector, and f is defined by a javascript function (ex: https://github.com/adussaq/amd_cf/blob/master/cyclingEq.js). In addition to the parameter vector, it returns an R2 and a WW Runs Test to measure goodness of fit.
 
These modules were combined with the following visualization libraries: google chart tools (https://developers.google.com/chart/), jqmath (http://mathscribe.com/author/jqmath.html), bootstrap (http://getbootstrap.com/) and jquery (http://jquery.com/) to create a tool to visualize individual curve fits. This is avaliable at http://kinome.github.io/demo-cf/#model (Figure 2). This represents a small example of the tool as it was applied to the remainder of the data.
