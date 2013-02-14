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

    taskModalDescription = function(model) {
        var l = _.find(BoardView.List.collection.models, function(v) { return v.id === model.get("listid") });
        // setting task attributes
        $('#task-modal').find(".taskname").html(model.get("description"));
	$('#task-modal').find(".taskduedate").html(model.get("due_date"));
        $('#task-modal').find(".listname").html(l.get("name"));

        var nf = $('#task-modal').find(".name-form");
        var header = $('#task-modal').find(".header");
        var ta = nf.find("textarea");
        ta.val(model.get("description"));
	var dd = nf.find("[name=due_date]");
	dd.val(model.get("due_date"));

        nf.hide();

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
			   $('#task-modal').find(".taskduedate").html(dd.val());
                           nf.hide();
                           header.show();
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
            $(".allmembers").append(link);
            link.click(function() {
                Task.assign(model, $(this).data('user'));
            });
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
