var BoardFilteredView = {};
_.extend(BoardFilteredView, this.BoardView);

BoardFilteredView.dateReport = {};

/*BoardFilteredView.List.ListView = BoardView.List.ListView.extend({
    render: function() {
	if( BoardFilteredView.listId == this.model.attributes.id)
	{
	    return this.constructor.__super__.render.apply(this);
	} else if (BoardFilteredView.listId == false && 
		   BoardFilteredView.countedTasks[this.model.attributes.id] > 0)
	{
	    return this.constructor.__super__.render.apply(this);
	} else 
	{
	    return "";
	}
    }
});*/

BoardFilteredView.Task.TaskView = BoardView.Task.TaskView.extend({
    render: function() {
	var Today = new Date();
	var NextWeek = new Date(Today.getFullYear(),
				Today.getMonth(),
				Today.getDate() + 7);
	var due_date = new Date(this.model.attributes.due_date);
	var res;
	
	Today.setHours(0);
	Today.setMilliseconds(0);
	Today.setMinutes(0);
	Today.setSeconds(0);

	if(BoardFilteredView.dateReport[this.model.attributes.listid]
	   == undefined)
	{
	    BoardFilteredView.dateReport[this.model.attributes.listid] = {
		overdue: 0,
		today: 0,
		on_schedule: 0,
		this_week: 0,
	    };
	}

	res = this.constructor.__super__.render.apply(this);

	/* FIXME: HTML markup in the Javascript is the true evil, should be
	   moved to a template in the future */

	if( due_date < Today) {
	    $(res.el).find(".date_status").html("<span class='label label-important'>Overdue</span>");
	    BoardFilteredView.dateReport[this.model.attributes.listid].overdue++;
	} else if(due_date > NextWeek) {
	    $(res.el).find(".date_status").html("<span class='label'>On schedule</span>");
	    BoardFilteredView.dateReport[this.model.attributes.listid].on_schedule++;
	} else if(due_date > Today && due_date <= NextWeek) {
	    $(res.el).find(".date_status").html("<span class='label label-success'>This week</span>");
	    BoardFilteredView.dateReport[this.model.attributes.listid].this_week++;
	} else {
	    $(res.el).find(".date_status").html("<span class='label label-warning'>Today</span>");
	    BoardFilteredView.dateReport[this.model.attributes.listid].today++;
	}

	return res;
    }
});

BoardFilteredView.filter = function (callback) {
    BoardFilteredView.Task.views.forEach(function(v) {
	v.el.hidden = callback(v.model);
    });
}


BoardFilteredView.filterLists = function (callback) {
    BoardFilteredView.List.views.forEach(function(v) {
	if(v.model.id == BoardFilteredView.listId ||
	   (BoardFilteredView.listId == false && BoardFilteredView.countedTasks[v.model.id])) {
	    v.el.hidden = false;
	} else {
	    v.el.hidden = true;
	}
    });
}

BoardFilteredView.countedTasks = {};

BoardFilteredView.countTasks = function () {
    BoardFilteredView.Task.collections.forEach( function(list) {
	BoardFilteredView.countedTasks[list.lurl] = list.length;
    });
}


var FilterRouters = Backbone.Router.extend({
    routes: {
	"date":    "date",
	"":        "all",
    },
});

var appFilters = new FilterRouters;

function uglyWayToGetListIdWhenDomIsNotReady() {
    return document.location.pathname.split('/')[3]
}


function generateQuickReport() {
    var bar_thisWeek = "<div class='bar bar-success' style='width: #%;'></div>";
    var bar_overdue = "<div class='bar bar-danger' style='width: #%;'></div>";
    var bar_today = "<div class='bar bar-warning' style='width: #%;'></div>";

    var overdue, onSchedule, thisWeek, today;

    if(BoardFilteredView.listId == false)
    {
	overdue = 0; 
	onSchedule = 0; 
	thisWeek = 0; 
	today = 0;

	for(var listId in BoardFilteredView.dateReport) {
	    overdue += BoardFilteredView.dateReport[listId].overdue;
	    onSchedule += BoardFilteredView.dateReport[listId].on_schedule;
	    thisWeek += BoardFilteredView.dateReport[listId].this_week;
	    today += BoardFilteredView.dateReport[listId].today;
	}
    } else {
	overdue = BoardFilteredView.dateReport[BoardFilteredView.listId].overdue;
	onSchedule = BoardFilteredView.dateReport[BoardFilteredView.listId].on_schedule;
	thisWeek = BoardFilteredView.dateReport[BoardFilteredView.listId].this_week;
	today = BoardFilteredView.dateReport[BoardFilteredView.listId].today; 
    }

    totalTasks = overdue + onSchedule + thisWeek + today;

    overduePerc = Math.round((overdue / totalTasks)*100);
    todayPerc = Math.round((today / totalTasks)*100);
    thisWeekPerc = Math.round((thisWeek / totalTasks)*100);


    bar_thisWeek = bar_thisWeek.replace('#', thisWeekPerc);
    bar_overdue = bar_overdue.replace('#', overduePerc);
    bar_today = bar_today.replace('#', todayPerc);

    $(".progress").html(bar_thisWeek + bar_today + bar_overdue);
    
    if(overdue > 0) {
	$("#delayedQty").html(overdue + " tasks are delayed.");
    }

    if(onSchedule > 0) {
	$("#othersQty").html(onSchedule + " tasks has a long term (more than a week) due date.");
    }

    if(today > 0) {
	$("#todayQty").html(today + " tasks should be closed today.");
    }

    if(thisWeek > 0) {
	$("#weekQty").html(thisWeek + " tasks are due for this week.");
    }


    clearInterval(BoardFilteredView.reportInterval);

}


function handleRouteDate() {
    var listId;

    BoardFilteredView.activeNav = $("#dateNav");
    $("#dateNav").addClass('active');

    if(BoardFilteredView.listId == undefined) {
	listId = uglyWayToGetListIdWhenDomIsNotReady();
    } else if(BoardFilteredView.listId == false) {
	listId = "all";
    } else {
	listId = BoardFilteredView.listId;
    }


    var url = "/api/boards/" + BoardFilteredView.boardId + "/lists/" + listId + "/tasks/dates";
    var data = "_csrf_token=" + $("#csrf_token").val();
    var req = $.ajax({url:url, data:data});

    req.done(function (data) {
	BoardFilteredView.filterLists();
	var template = _.template($("#date-filter-options").html())
	var _data = {
	    min_date: data.objects.min_date,
	    max_date: data.objects.max_date,
	};

	$("#filter-options").html(template(_data))
	
	$("input[type=date]").change(function() {
	    BoardFilteredView.filter(Ftask.Filters.filterByDate);
	});

	$("#allTasks").click(function () {
	    $("#min_date").val($("#min_date_js").val());
	    $("#max_date").val($("#max_date_js").val());
	    $("input[type=date]").change();
	});

	$("#overdueTasks").click(function () {
	    var today = new Date();
	    var yesterday = new Date(today.getFullYear(),
				     today.getMonth(),
				     today.getDate() - 1);

	    $("#min_date").val($("#min_date_js").val());
	    $("#max_date").val(yesterday.getMonth() + 1 + "/" +
			       yesterday.getDate() + "/" +
			       yesterday.getFullYear());
	    $("input[type=date]").change();
	});

	$("#todayTasks").click(function () {
	    var today = new Date();


	    $("#min_date").val(today.getMonth() + 1 + "/" +
			       today.getDate() + "/" +
			       today.getFullYear());
	    $("#max_date").val(today.getMonth() + 1 + "/" +
			       today.getDate() + "/" +
			       today.getFullYear());
	    $("input[type=date]").change();
	});

	$("#thisWeekTasks").click(function () {
	    var today = new Date();
	    today.setDate(today.getDate() + 1);
	    var nextWeek = new Date(today.getFullYear(),
				    today.getMonth(),
				    today.getDate() + 7);

	    $("#min_date").val(today.getMonth() + 1 + "/" +
			       (today.getDate()) + "/" +
			       today.getFullYear());
	    $("#max_date").val(nextWeek.getMonth() + 1 + "/" +
			       nextWeek.getDate() + "/" +
			       nextWeek.getFullYear());
	    $("input[type=date]").change();
	});


	/* FIXME: A quite ugly way to wait until all the views are rendered for 
	   the first time. */
	BoardFilteredView.reportInterval = setInterval(generateQuickReport,
						       1000);

    });

    req.fail(function (data) {
	alert("ERROR");
    });

}

BoardFilteredView.List.collection.on("sync", function () {
    BoardFilteredView.filterLists();
});

appFilters.on("route:date", handleRouteDate );

appFilters.on("route:all", function() {
    $("#filter-options").html("");
    BoardFilteredView.activeNav.removeClass('active');
    BoardFilteredView.filter(Ftask.Filters.filterNone);
});

$("#expandToAll").click(function () {
    BoardFilteredView.listId = false;
    BoardFilteredView.countTasks();
    handleRouteDate();
});


Backbone.history.start();
