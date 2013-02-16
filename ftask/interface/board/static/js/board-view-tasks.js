    function updateTaskOrder(lid) {
        var obj = $("#"+ lid + " .task");
        var sortedTasks = obj.sort(function(a, b) { return $(a).data("order") < $(b).data("order") ? -1 : 1 });
        var cards = $("#"+ lid + " .cards");
        cards.append(sortedTasks);
    }



(function() {
    var Task = this.BoardView.Task = {};

    // New task form params
    // p is the parent object in which prepend the form
    // obj should be a backbone ListModel
    Task.newCardForm = function (p, obj) {
        if (p.find("#task-"+obj.id).length > 0) {
            p.find("textarea").focus();
            return;
        }

        var template = _.template($('#new-task-template').html());
        var tmpl = template({id: obj.get('id')});
        p.prepend(tmpl);
        p.find("form").attr("id", "task-"+obj.id);
        p.find(".close").click(function() {
            $(this).parent().remove();
        });

        p.find("textarea").focus();
        p.find("textarea").keypress(function(event) {
            if ( event.which == 13 ) {
                event.preventDefault();
                $("#task-"+obj.id).submit();
            }
        });

        Ftask.form("#task-"+obj.id,
                   function(data) {
                        alert("ERROR");
                   },
                   function(data) {
                        $("#task-"+obj.id).remove();
                        BoardView.sync();
                   });
    }

    Task.views = new Array();
    Task.collections = new Array();

    Task.createTaskCollection = function (l) {
        // task collection
        var tc = new Task.Tasks();
        tc.lurl = l.id;
        tc.on("add", function(t) {
            var view = new Task.TaskView({model: t});
            var el = $(view.render().el);
            $("#"+ t.get("listid") + " .cards").append(el);

            makeTaskDraggable(el);
            Task.views.push(view);

            //updateTaskOrder(t.model.get("listid"));
            BoardView.resizeBoard();
        });
        tc.on("remove", function(t) {
            var view = _.find(Task.views, function(v) { return v.model === t});
            view.remove();
            Task.views = _.filter(Task.views, function(v) { return v.model != t });

            //updateTaskOrder(t.model.get("listid"));
            BoardView.resizeBoard();
        });
        tc.on("change", function(l) {
            BoardView.resizeBoard();
        });
        Task.collections.push(tc);
        tc.fetch({update: true});
    }

    Task.removeTaskCollection = function (l) {
        var tv = _.find(Task.views, function(tv) { return tv.model.get("listid") === l.id });
        tv.remove();
        Task.views = _.filter(Task.views, function(tv) { return tv.model.get("listid") != l.id });
        // removing task collection
        var tc = _.find(Task.collections, function(tc) { return tc.lurl === l.id });
        tc.remove();
        Task.collections = _.filter(Task.collections, function(tc) { return tc.lurl != l.id });
    }

    // Backbone stuff

    Task.Task = Backbone.Model.extend({
        idAttribute: "id",
	due_date: "due_date",

	initialize: function (attrs) {
	    this.due_date = Date.new(this.attributes.due_date);
	},

	toJSON: function (options) {
	    ret = _.clone(this.attributes);

	    if(options != undefined && options.override_due_date) {
		ret.due_date = this.due_date.toLocaleDateString();
	    }

	    return ret;
	},
    });

    Task.Tasks = Backbone.Collection.extend({
        model: Task.Task,
        parse: function(response) {
            var models = new Array();
            for (var i=0; i<response.meta.total; i++) {
                var model = new Task.Task(response.objects[i]);
                models.push(model);
            }
            return models;
        },
        url: function() {
            return Ftask.baseApiBoard + '/' + BoardView.boardId + '/lists/' + this.lurl + '/tasks/';
        }
    });

    Task.TaskView = Backbone.View.extend({
        tagName: "div",
        className: "task",
        template: _.template($('#task-template').html()),

        initialize: function() {
            this.listenTo(this.model, 'change:description', this.descriptionChanged);
            this.listenTo(this.model, 'change:order', this.orderChanged);
            this.listenTo(this.model, 'change:assign', this.assignChanged);
            //this.listenTo(this.model, 'change:listid', this.orderChanged);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON({override_due_date: true})));
            var model = this.model;
            this.$el.attr("id", model.id);
            this.$el.data("order", model.get("order"));
            this.$el.data("order", model.get("order"));

            this.assignChanged();

            this.$el.click(function() {
                Task.Modal.taskModal(model);
                return false;
            });

            this.$el.find('.dropdown-toggle').click(function() {
                var dropdown = $("#task-dropdown");
                dropdown.show();
                dropdown.css('position', 'absolute');
                dropdown.css('top', $(this).offset().top);
                dropdown.css('left', $(this).offset().left - 100);
                dropdown.mouseleave(function() {
                    $(this).hide();
                });

                dropdown.find(".task-assign").unbind('click').click(function() {
                    Task.Modal.taskModalMembers(model);
                    return true;
                });

                dropdown.find(".task-remove").unbind('click').click(function() {
                    Task.Modal.taskRemove(model);
                    dropdown.hide();
                    return false;
                });

                return false;
            });

            return this;
        },

        descriptionChanged: function() {
            this.$el.find(".description").html(this.model.get("description"));
        },

        assignChanged: function() {
            var model = this.model;
            var assign = model.get("assign");
            var members = this.$el.find(".onetaskmembers");
            members.empty();
            for (var i = 0; i < assign.length; i++) {
                var u = assign[i];
                var img = $.gravatar(u["email"], {'size': 30});
                members.append('<span class="miniuser"><img src="'+img.attr('src')+'"/></span>');
            }
            if (Task.Modal.taskId === model.id) {
                Task.Modal.taskModalMembers(model);
            }
        },

        orderChanged: function() {
            this.$el.data("order", this.model.get("order"));
            updateTaskOrder(this.model.get("listid"));
        }
    });

    Task.assign = function(t, user) {
        var token = $("#csrf_token").val();
        var url = Ftask.baseApiBoard + '/' + BoardView.boardId + '/lists/' + t.get("listid") + '/tasks/' + t.id + '/assign/';
        var data = {'_csrf_token': token, 'user': user};
        var req = $.ajax({url:url, data: data, type:"POST"});
        req.done(function(data) {
            BoardView.sync();
            Ftask.updateCsrf();

            var u = _.find(BoardView.members.models, function(m) { return m.get('username') === user; });
            var img = $.gravatar(u.get("email"), {'size': 30});
        });
        req.fail(function(data) {
            alert("ERROR");
            Ftask.updateCsrf();
        });
        return false;
    }

    Task.unassign = function(t, user) {
        var token = $("#csrf_token").val();
        var url = Ftask.baseApiBoard + '/' + BoardView.boardId + '/lists/' + t.get("listid") + '/tasks/' + t.id + '/unassign/';
        var data = {'_csrf_token': token, 'user': user};
        var req = $.ajax({url:url, data: data, type:"POST"});
        req.done(function(data) {
            BoardView.sync();
            Ftask.updateCsrf();

            var u = _.find(BoardView.members.models, function(m) { return m.get('username') === user; });
            var img = $.gravatar(u.get("email"), {'size': 30});
        });
        req.fail(function(data) {
            alert("ERROR");
            Ftask.updateCsrf();
        });
        return false;
    }

    // internal functions


    // drag & drop

    function makeTaskDraggable(el) {
        $(el).draggable({
            containment: ".board",
            cursor: "move",
            start: dragTaskStart,
            stop: dragTaskStop,
            helper: dragTaskHelper
        });

        $(el).droppable({
            over: dropTaskOver,
            drop: dropMember,
        });
    }

    // task drag functions
    function dragTaskHelper(e) {
        var helper = $(this).clone();
        helper.addClass("dragging");
        helper.width($(this).width());
        return helper;
    }

    function dragTaskStart(e, ui) {
        $(this).addClass("dragging-freeze");
        BoardView.syncLock = true;
    }

    function dragTaskStop(e, ui) {
        $(this).removeClass("dragging-freeze");

        // Change model order attr and update
        var list = $(this).parent().parent().parent();

        var tasks = list.find(".task");
        tasks.each(function(i, l) {
            var obj = $(l);
            if (!obj.hasClass("dragging")) {
                var view = _.find(Task.views, function(v) { return v.model.id === obj.attr("id") });

		/* FIXME: By modifying the list template in the filter view, 
		   it's very likely that the list-list check won't be required 
		   any more. Remove in future updates */
		   
		list_id = list.attr("id") == "list-list" ? BoardFilteredView.listId : list.attr("id");

                view.model.set({"order": i, "listid": list_id}, {silent: true});
                view.$el.data("order", i);

                var url = '/api/boards/' + BoardView.boardId + '/lists/'+list.attr("id")+'/tasks/'+view.model.id+'/';
                var token = $("#csrf_token").val();
                var data = {'_csrf_token': token, 'order': i, 'listid': list_id};
                var req = $.ajax({url:url, data:data, type:"PUT"});
                req.done(function(data) {
                    Ftask.updateCsrf();
                    BoardView.syncLock = false;
                });
                req.fail(function(data) {
                    Ftask.updateCsrf();
                    BoardView.syncLock = false;
                });
            }
        });
    }

    function dropTaskOver(e, ui) {
        var o1 = ui.draggable;
        var o2 = $(this);
        if (o1.hasClass("task")) {
            o1.insertAfter(o2);
        }
    }

    function dropMember(e, ui) {
        var o1 = ui.draggable;
        var o2 = $(this);
        var username = o1.data('user');
        var tid = o2.attr("id");
        if (o1.hasClass("member")) {
            // finding the task
            var t = null;
            _.each(Task.collections, function(c) {
                var t1 = c.find(function(x) { return x.id == tid });
                if (t1) {
                    t = t1;
                }
            });
            if (t)
                Task.assign(t, username);
        }
    }
}).call(this);
