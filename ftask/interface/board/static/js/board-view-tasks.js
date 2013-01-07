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
        });
        tc.on("remove", function(t) {
            var view = _.find(Task.views, function(v) { return v.model === t});
            view.remove();
            Task.views = _.filter(Task.views, function(v) { return v.model != t });
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
        idAttribute: "id"
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
            //this.listenTo(this.model, 'change:listid', this.orderChanged);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            var model = this.model;
            this.$el.attr("id", model.id);
            this.$el.data("order", model.get("order"));

            // task modal
            this.$el.click(function() {
                var l = _.find(BoardView.List.collection.models, function(v) { return v.id === model.get("listid") });
                $('#task-modal').modal('show');
                $('#task-modal').find(".taskname").html(model.get("description"));
                $('#task-modal').find(".listname").html(l.get("name"));
                var nf = $('#task-modal').find(".name-form");
                var header = $('#task-modal').find(".header");
                var ta = nf.find("textarea");
                ta.val(model.get("description"));
                nf.hide();

                $('#task-modal').find(".taskname").click(function() {
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
                                    nf.hide();
                                    header.show();
                               });
                });

                $('#task-modal').find(".close").click(function() {
                    nf.hide();
                    header.show();
                });

                // remove action
                $('#task-modal').find(".remove-action").click(function() {
                    var token = $("#csrf_token").val();
                    var url = Ftask.baseApiBoard + '/' + BoardView.boardId + '/lists/' + model.get("listid") + '/tasks/' + model.id + '/';
                    var req = $.ajax({url:url + '?_csrf_token='+token, type:"DELETE"});
                    req.done(function(data) {
                    $('#task-modal').modal('hide');
                        BoardView.sync();
                        Ftask.updateCsrf();
                    });
                    req.fail(function(data) {
                        alert("ERROR");
                        Ftask.updateCsrf();
                    });
                    return false;
                });
            });

            return this;
        },

        descriptionChanged: function() {
            this.$el.find(".description").html(this.model.get("description"));
        },

        orderChanged: function() {
            this.$el.data("order", this.model.get("order"));
            updateTaskOrder(this.model.get("listid"));
        }
    });

    // internal functions

    function updateTaskOrder(lid) {
        var obj = $("#"+ lid + " .task");
        var sortedTasks = obj.sort(function(a, b) { return $(a).data("order") < $(b).data("order") ? -1 : 1 });
        var cards = $("#"+ lid + " .cards");
        cards.append(sortedTasks);
    }

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
        var list = $(this).parent().parent();
        var tasks = list.find(".task");
        tasks.each(function(i, l) {
            var obj = $(l);
            if (!obj.hasClass("dragging")) {
                var view = _.find(Task.views, function(v) { return v.model.id === obj.attr("id") });
                view.model.set({"order": i, "listid": list.attr("id")}, {silent: true});
                view.$el.data("order", i);

                var url = '/api/boards/' + BoardView.boardId + '/lists/'+list.attr("id")+'/tasks/'+view.model.id+'/';
                var token = $("#csrf_token").val();
                var data = {'_csrf_token': token, 'order': i, 'listid': list.attr("id")};
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

}).call(this);
