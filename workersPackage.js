/*global console, window, Worker, amd_ww */

//Passed JS-Lint - Alex Dussaq 2/20/2015
var amd_ww = (function () {
    'use strict';

    //variable declarations
    var lib, run, reportError, startWorkers, createWorkerObj;

    //variable defintions
    lib = {};

    lib.startWorkers = function (start_obj) {
        /*////////////////////////////////////////////////////////////////////////////////
        This function starts workers to have jobs passed to them. It is prudent to call
            <lib>.clearWorkers in the callback of the onComplete function to clear workers
            however when this is called it clears all existing workers.
        ARGV: start_obj has three options: 
            filename -  (string) all workers need a file to be run, pass that in here,
                this is the only required options
            num_workers - (number) the number of workers to start, I would recommend 
                no more than 2-4 workers at a time. (Default 4)
            callback - (function) called once workers are started. (Should pause program
                execution until they are called anyways, however if you are worried use
                this parameter.)
            onError - (function) called if a web worker reports an error, default
                is to call reportError()
        
        !! The return of this object is the object for submitting jobs/clearing jobs.

        TODO: fix these comments to make more sense, add information about what returned
            object can do, pass the returned object into callback as well as returning it,
            possibly give the returned object a start workers function so it can clear
            and restart all of its workers.
        */////////////////////////////////////////////////////////////////////////////////

        //Run the actual program
        return run(startWorkers)(start_obj);
    };

    reportError = function (err) {
        return console.error("Worker error: " + err + "\nTo display more information for any" +
            " function type <func_name> instead of <func_name>()");
    };

    run = function (func) {
        return function () {
            var y;
            try {
                y = func.apply(null, arguments);
            } catch (err) {
                reportError(err);
            }
            return y;
        };
    };

    startWorkers = function (start_obj) {
        //Variables Declarations
        var callback, errorFunc, filename, numJobs;

        //Variable Definitions
        start_obj = start_obj || undefined;
        if (!start_obj) {
            throw 'Must define start_obj with at least the workers file.';
        }
        callback = start_obj.callback !== undefined ?  start_obj.callback : function () {
            return;
        };
        errorFunc = start_obj.onError || reportError;
        reportError = errorFunc;
        numJobs = start_obj.num_workers !== undefined ? start_obj.num_workers : 4;
        numJobs *= 1;
            //Coerces into a number drops decimals if .000... 
        filename = start_obj.filename;

        //Make sure workers are available
        if (!window.Worker) {
            throw 'Workers are not available in this browser.';
        }

        //Check Variable definitions
        if (isNaN(numJobs) || numJobs !== parseInt(numJobs, 10)) {
            throw 'num_workers must be an integer';
        }
        if (typeof callback !== 'function') {
            throw 'callback must be a function';
        }
        if (typeof errorFunc !== 'function') {
            throw 'onError must be a function';
        }
        //This is the first check for a filename, the worker will do the second check
        if (typeof filename !== 'string' || !filename.match(/\.js$/)) {
            throw 'Must pass in a filename as a string for worker functionality';
        }
        return createWorkerObj(start_obj);
    };

    createWorkerObj = function (start_obj) {
        //Declare local vars
        var clearWorkers, finishFunction, jobsArray, sublib, setFinishFunction, paused,
            startJob, submitJob, post_callback, workersArr, onComplete, nextJob;

        //Define local vars
        onComplete = function () {
            return;
        };
        jobsArray = [];
        sublib = {};
        workersArr = [];
        paused = false;

        //Global function declarations
        sublib.clearWorkers = function (callback) {
            /*////////////////////////////////////////////////////////////////////////////////
            This function closes all active workers.
            ARGV: callback - (function) function to execute once workers are cleared, optional
            */////////////////////////////////////////////////////////////////////////////////
            clearWorkers(callback);
        };

        sublib.onComplete = function (callback) {
            /*////////////////////////////////////////////////////////////////////////////////
            This function sets the function to be called once all processes are complete
                it MUST be called after all jobs have been submitted and must be passed a 
                callback function. It is prudent to call <lib>.clearWorkers in the callback 
                of this function to clear workers, however when they are automatically cleared
                if more are started.
            ARGV: callback - (function, required) function to execute once all submitted jobs have ran.
                    takes no parameters.
            */////////////////////////////////////////////////////////////////////////////////

            //Run the actual program
            run(onComplete)(callback);
        };

        sublib.submitJob = function (job, callback) {
            /*////////////////////////////////////////////////////////////////////////////////
            This function adds a job to the queue of jobs to accomplish
            ARGV: job - (object, required) This will be submitted to the worker file, the file must then
                    know how to handle the submission.
                callback - (function) function to be preformed once the submitted job is 
                     finished, take the return parameter from a web worker which is an object 
                    of this structure:
                        {"ports":<array>,
                        "cancelBubble":<bool>,
                        "cancelable":<bool>,
                        "source":<object>,
                        "eventPhase":<number, as string>,
                        "timeStamp":<number as string>,
                        "lastEventId":<string>,
                        "currentTarget":<object>,
                        "target":<object>,
                ********"data":<return from worker>,******** Key element to process typically
                        "type":<string>,
                        "bubbles":<bool>,
                        "defaultPrevented":<bool>,
                        "origin":<string>,
                        "returnValue":<bool>,
                        "srcElement":<object>}
            */////////////////////////////////////////////////////////////////////////////////

            //Run the actual program
            run(submitJob)(job, callback);
        };

        //Local functions
        clearWorkers = function (callback) {
            var i;
            callback = callback !== undefined ?  callback : function () {
                return;
            };
            for (i = 0; i < workersArr.length; i += 1) {
                if (workersArr[i] !== undefined) {
                    workersArr[i][0].terminate();
                    workersArr[i] = undefined;
                }
            }
            delete sublib.submitJob;
            delete sublib.onComplete;
            delete sublib.clearWorkers;

            callback();
        };

        post_callback = function () {
            //local variables
            var i;

            //Make sure that all the workers are done
            for (i = 0; i < workersArr.length; i += 1) {
                if (workersArr[i][1]) {
                    return;
                }
            }
            if (typeof finishFunction === 'function') {
                finishFunction();
                finishFunction = undefined;
                paused = false;
            }
        };

        setFinishFunction = function (callback) {
            //Check to make sure user input is good
            if (typeof callback !== 'function') {
                throw 'onComplete must be passed a function';
            }
            //set the function to the approriate definition, then make sure it isn't already 
                //done
            jobsArray.push(['&&&onComplete&&&', callback]);

            //Check if there are workers available to submit jobs to
            nextJob();
        };

        startJob = function (workerToStart) {
            //Variables declarations
            var callback, job, message, worker;

            //Variable definitions

            worker = workersArr[workerToStart][0];
            workersArr[workerToStart][1] = true; //This is to make sure multiple jobs are not
                //submitted

            //Make sure we are not paused
            if (paused) {
                post_callback();
                return;
            }

            //make sure there are jobs to do
            if (jobsArray.length > 0) {
                job = jobsArray.shift();
                callback = job[1];
                message = job[0];
            } else {
                workersArr[workerToStart][1] = false;
                post_callback();
                return;
            }

            //Create on message portion of the worker
            worker.onmessage = function (e) {
                callback(e);
                startJob(workerToStart);
            };

            //Post the message to the worker
            if (typeof message === 'string' && message === '&&&onComplete&&&') {
                paused = true;
                finishFunction = callback;
                post_callback();
            } else {
                worker.postMessage(message);
            }
        };

        submitJob = function (message, callback) {
            //variable definitions
            callback = callback !== undefined ?  callback : function () {
                return;
            };

            //Check user input
            if (typeof callback !== 'function') {
                throw 'submitJob callback must be a function';
            }

            //Add job to jobs array
            jobsArray.push([message, callback]);
            nextJob();
        };

        nextJob = function () {
            var i;
            //Check if there are workers available to submit jobs to
            for (i = 0; i < workersArr.length; i += 1) {
                if (!workersArr[i][1]) {
                    startJob(i);
                    break;
                }
            }
        };

        onComplete = setFinishFunction;

        //Actually start the workers for this scope
        (function () {
            var errorFunc, filename, numJobs, i;
            //callback = start_obj.callback || function () {};
            errorFunc = start_obj.onError !== undefined ? function (err) {
                start_obj.onError(err);
                onComplete = function () {
                    return;
                };
                finishFunction = function () {
                    return;
                };
            } : function (err) {
                reportError(err);
                onComplete = function () {
                    return;
                };
                finishFunction = function () {
                    return;
                };
            };
            numJobs = start_obj.num_workers !== undefined ? start_obj.num_workers : 4;
            numJobs *= 1;
                //Coerces into a number drops decimals if .000... 
            filename = start_obj.filename;

            //Actually start the workers (reset first)
            for (i = 0; i < numJobs; i += 1) {
                if (workersArr[i] !== undefined) {
                    workersArr[i][0].terminate();
                    workersArr[i] = undefined;
                }
                workersArr[i] = [new Worker(filename), false];
                workersArr[i][0].onerror = errorFunc;
            }
        }());

        //return lib
        return sublib;
    };
    return lib;
}());
