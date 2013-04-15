var ProfileRouters = Backbone.Router.extend({
    routes: {
	"assigned":    "assigned",
	"":            "profile",
    },
});

var appProfile = new ProfileRouters;

appProfile.on("route:assigned", function () {
    var req = $.ajax({url: api_url});

    req.done(function (data) {
	var html = "<table class='table'><thead><tr><th>Description</th><th>Due date</th><th>Status</th></tr></thead><tbody>";

	var template = _.template($("#task-template").html())

	for(o in data.objects) {
	    if(new Date(data.objects[o].due_date) < new Date())
	    {
		data.objects[o].status = "Delayed";
		data.objects[o].css_status = "error";
	    }

	    row_html = template(data.objects[o]);
	    html = html + row_html;
	}
	html = html + "</tbody></table>";

	$("#main_content").html(html);
    });

    req.fail( function(data) {
	alert("ERROR");
    });
});

appProfile.on("route:profile", function () {

});


Backbone.history.start();


