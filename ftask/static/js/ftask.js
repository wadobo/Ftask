(function() {
    var Ftask = this.Ftask = {};

    Ftask.baseApi = '/api';
    Ftask.baseApiAuth = Ftask.baseApi + '/users';
    Ftask.baseApiBoard = Ftask.baseApi + '/boards';

    Ftask.ldg = 0;
    // Shows a  loading animation
    Ftask.loading = function (loading) {
        if (loading) {
            Ftask.ldg++;
            $("#mini-loading").fadeIn();
        } else {
            Ftask.ldg--;
            if (Ftask.ldg <= 0) {
                $("#mini-loading").fadeOut();
                Ftask.ldg = 0;
            }
        }
    }

    // Queries the csrf token to the api
    Ftask.updateCsrf = function () {
        Ftask.loading(true);
        var req = $.get(Ftask.baseApiAuth + '/csrf_token/', {}, function(data) {
            $("#csrf_token").val(data.token);
            Ftask.loading(false);
        });
    }

    // Convert a html form in a ajax query to the api
    Ftask.form = function (id, onerror, onsuccess, serialize) {

        function done () {
            if ($("#csrf_token").length) {
                Ftask.updateCsrf();
            }
            $("#loading").fadeOut();
        }

	function default_serialize(data) {
	    return data.serialize;
	}

        $(id).unbind('submit').submit(function() {
            var url = $(id).data("url");

	    if(typeof serialize != "function")
	    {
		var data = default_serialize($(id));
	    } else {
		var data = serialize($(id));
	    }

            var method = $(id).attr("method");

            if ($("#csrf_token").length) {
                data += "&_csrf_token="+$("#csrf_token").val();
            }

            $("#loading").fadeIn();
            var req = $.ajax({url:url, data:data, type:method});
            // DONE
            req.done(function(data) {
                var next = $(id).data("next");
                if (next && data.status === "success") {
                    window.location.href = next;
                } else {
                    onsuccess(data);
                }

                done();
            });

            // ERROR
            req.fail(function(data) {
                onerror(data);
                done();
            });

            return false;
        });
    }

    // Filters

    Ftask.Filters = {
	filterNone: function (task) {
	    return false;
	},

	filterByDate: function (task) {
	    var min_date = Date.new($("#min_date").val() + "T00:00:00");
	    var max_date = Date.new($("#max_date").val() + "T00:00:00");

	    /* if(task.attributes.visibility == undefined) {
		task.attributes.visibility = true;
	    } */

	    dueDate = task.due_date;

	    if(dueDate >= min_date && dueDate <= max_date)
	    {
		return false;
	    } else {
		return true;
	    }
	}
    };


    // Date handling functions

    Date.new = function(str) {
	d = new Date(str);

	if(isNaN(d.getTime())) {
	    d = str.split('T')[0].split('-');
	    d = new Date(d[0], d[1] - 1, d[2]);
	}

	return d;
    }

    Date.fromLocaleDateString = function (date) {
	if(typeof date != "string") {
	    throw new TypeError("date must be a string");
	}

	parsed_date = {};

	locale_date = new Date(1988, 7, 20).toLocaleDateString();

	/*
	  The next statement seems to only work OK on Firefox and Google Chrome,
	  wich returns a string of the type XX/YY/ZZ where XX, YY and ZZ values
	  depends on user locale. 

	  IE not tested.

	  Works on mobile version of Firefox Beta.

	  Tested on es-ES and en-EN locales

	*/

	example_date = locale_date.split('/');

	if(example_date.length == 1) 
	{
	    // This is a fix for all the browser wich doesn't take in account 
	    // the locales in my computer (a.k.a. Opera) or give the answer
	    // in other format than the specified above (a.k.a Opera and 
	    // older versions of Google Chrome).

	    junk_date = locale_date.split(/ |,/);
	    
	    example_date = junk_date.map(function (i) {
		if(i == 20) {
		    return 20;
		} else if (i == 1988) {
		    return 1988;
		} else if (i.match(/[A|a]ug/)) {
		    return 8;
		}
	    }).filter(Number);

	    // If still is not able to find 3 valid tokens, default's to ISO
	    // format

	    if(example_date.length != 3) {
		example_date = [1988, 8, 20];
	    }
	}

	template = example_date.map(function (i) {
	    if(i == 1988) {
		return 'y';
	    } else if (i == 8) {
		return 'm';
	    } else {
		return 'd';
	    }
	});

	input_date = date.split('/');

	if(input_date.length != 3) {
	    throw new SyntaxError("Invalid date");
	}

	parsed_date[template[0]] = input_date[0];
	parsed_date[template[1]] = input_date[1];
	parsed_date[template[2]] = input_date[2];

	return new Date(parsed_date.y, parsed_date.m - 1, parsed_date.d);
    }

    Date.today = new Date();

    Date.today.setHours(0);
    Date.today.setMilliseconds(0);
    Date.today.setMinutes(0);
    Date.today.setSeconds(0);


    Date.yesterday = new Date(Date.today.getFullYear(),
			      Date.today.getMonth(),
			      Date.today.getDate() - 1);

    Date.tomorrow = new Date(Date.today.getFullYear(),
			     Date.today.getMonth(),
			     Date.today.getDate() + 1);
    

    Date.nextWeek = new Date(Date.tomorrow.getFullYear(),
			     Date.tomorrow.getMonth(),
			     Date.tomorrow.getDate() + 7);


    Date.prototype.toISODateString = function () {
	// I don't use .toISOString because the results may fool Ftask. Due to
	// the time zone that the Date object automatically adds based on the 
	// user's locale, the return of toISOString will be shifted some hours
	// in order to adjust the returned string to the GMT hour, potentially
	// returning an invalid day.

	if((this.getMonth() + 1) < 10){
	    month = "0" + (this.getMonth() + 1);
	} else {
	    month = this.getMonth() + 1;
	}
	
	if(this.getDate() < 10){
	    day = "0" + this.getDate();
	} else {
	    day = this.getDate();
	}

	return this.getFullYear() + "-" + month + "-" + day;
    }

    Date.prototype.toPythonDateTime = function () {
	if((this.getMonth() + 1) < 10){
	    month = "0" + (this.getMonth() + 1);
	} else {
	    month = this.getMonth() + 1;
	}
	
	if(this.getDate() < 10){
	    day = "0" + this.getDate();
	} else {
	    day = this.getDate();
	}
	
	return this.getFullYear() + "-" + month + "-" + day + "T00:00:00.000";
    }
}).call(this);
