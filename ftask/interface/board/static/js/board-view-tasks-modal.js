(function() {
    var Task = this.BoardView.Task;
    var Modal = this.BoardView.Task.Modal = {};

    Modal.taskId = "";
    Modal.taskModal = function(model) {
        $('#task-modal').modal('show');
        Modal.taskId = model.id;

        // task modal description and edit with click
        taskModalDescription(model);

        // members
        Modal.taskModalMembers(model);

        // remove action
        Modal.taskModalRemoveAction(model);
    }

    renderComments = function(model) {
	var html_so_far = "";
	var template = _.template($('#comment-template').html());

	model.attributes.comments.forEach(function (comment) {
	    u = comment['user'];

	    var data = {
		gravatar_src: $.gravatar(u["email"], {'size': 100}).attr("src"),
		username: u['username'],
		comment: comment['comment'],
	    };

	    html_so_far += template(data);
	});

	return html_so_far;
    }

    taskModalDescription = function(model) {
        var l = _.find(BoardView.List.collection.models, function(v) { return v.id === model.get("listid") });
        // setting task attributes
        $('#task-modal').find(".taskname").html(model.get("description"));
	$('#task-modal').find(".taskduedate").html(model.due_date.toLocaleDateString());
        $('#task-modal').find(".listname").html(l.get("name"));
	$("#task-modal").find("#comments_board").html(renderComments(model));

	$("#ta_preview").hide();
	$("[name=comment]").show();

        var nf = $('#task-modal').find(".name-form");
        var header = $('#task-modal').find(".header");
        var ta = nf.find("textarea");
        ta.val(model.get("description"));
	var dd = nf.find("[name=due_date]");
	dd.val(model.due_date.toISODateString());

        nf.hide();

	$("[name=comment]").keydown(function (e) {
	    

	    if(e.ctrlKey && e.keyCode == 13)
	    {
		cf = $('#task-modal').find('.comment-form');

		cf.data('url', Ftask.baseApiBoard + '/' + BoardView.boardId + '/lists/' + l.id + '/tasks/' + model.id + '/comment/');

		Ftask.form("#task-modal .comment-form",
			   function(data) {
                               alert("ERROR");
			   },
			   function(data) {
			   });

		cf.submit();
		return false;
	    }

	    if(e.ctrlKey && e.keyCode == 80)
	    {
		ta = $("[name=comment]");
		ta_preview = $("#ta_preview");
		ta_preview.find("#tap_content").html(marked.parse(ta.val()));
		ta.hide();
		ta_preview.show();

		ta_preview.click(function () {
		    ta_preview.hide();
		    ta.show();
		});
		return false;
	    }
	});

        $('#task-modal').find(".taskname").unbind('click').click(function() {
            nf.show();
            header.hide();
            nf.data('url', Ftask.baseApiBoard + '/' + BoardView.boardId + '/lists/' + l.id + '/tasks/' + model.id + '/');

            Ftask.form("#task-modal .name-form",
                       function(data) {
                            alert("ERROR");
                       },
                       function(data) {
                           BoardView.sync();
                           $('#task-modal').find(".taskname").html(ta.val());
			   $('#task-modal').find(".taskduedate").html(Date.new(dd.val() + "T00:00:00.000").toLocaleDateString());
                           nf.hide();
                           header.show();
                       },
		       function(data) {
			   return $.param({
			       description: ta.val(),
			       due_date: dd.val() + "T00:00:00.000",
			   });
		       });
        });

        $('#task-modal').find(".close").unbind('click').click(function() {
            nf.hide();
            header.show();
        });
    }

    Modal.taskModalMembers = function(model) {
        var assign = model.get("assign");
        $(".taskmembers").empty();
        for (var i = 0; i < assign.length; i++) {
            var u = assign[i];
            var img = $.gravatar(u["email"], {'size': 30});

            // TODO add dropdown menu to remove
            var template = _.template($('#assign-template').html());
            var tmpl = $(template({url: img.attr('src'), user: u['username']}));
            $(".taskmembers").append(tmpl);

            function bindUnassign(tmpl, u) {
                tmpl.find(".remove-user").click(function() {
                    console.log(u['username']);
                    Task.unassign(model, u['username']);
                });
            }
            bindUnassign(tmpl, u);
        }

        // all members
        $(".allmembers").empty();
        for (var i = 0; i < BoardView.members.models.length; i++) {
            var u = BoardView.members.models[i];
            var img = $.gravatar(u.get("email"), {'size': 30});
            var link = $('<li data-user="'+u.get('username')+'"><a href="#" class="miniuser"><img src="'+img.attr('src')+'"/>'+u.get('username')+'</a></li>');
            link.click(function() {
                Task.assign(model, $(this).data('user'));
            });
            $(".allmembers").append(link);
        }
    }

    Modal.taskModalRemoveAction = function(model) {
        $('#task-modal').find(".remove-action").unbind('click').click(function() {
            Modal.taskRemove(model);
            return false;
        });
    }

    Modal.taskRemove = function(model) {
        var token = $("#csrf_token").val();
        var url = Ftask.baseApiBoard + '/' + BoardView.boardId + '/lists/' + model.get("listid") + '/tasks/' + model.id + '/';
        var req = $.ajax({url:url + '?_csrf_token='+token, type:"DELETE"});
        req.done(function(data) {
            $('#task-modal').modal('hide');
            BoardView.sync();
            Ftask.updateCsrf();
        });
        req.fail(function(data) {
            alert("ERROR:" + data);
            Ftask.updateCsrf();
        });
    }

}).call(this);
