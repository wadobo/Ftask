(function() {
    var List = this.BoardView.List = {};

    // Edit list name form
    // p is the parent object in which prepend the form
    // obj should be a backbone ListModel
    List.editNameForm = function(p, obj) {
        if (p.find("#name-"+obj.id).length > 0) {
            return;
        }

        var template = _.template($('#edit-listname-template').html());
        var tmpl = template({id: obj.get('id'), name: obj.get('name')});
        p.prepend(tmpl);
        p.find(".close").click(function() {
            $(this).parent().remove();
        });
        p.find("form").attr("id", "name-"+obj.id);

        Ftask.form("#name-"+obj.id,
                   function(data) {
                        alert("ERROR");
                   },
                   function(data) {
                        $(this).remove();
                        BoardView.sync();
                   });
    }

    // Backbone

    List.List = Backbone.Model.extend({
        idAttribute: "id"
    });

    List.Lists = Backbone.Collection.extend({
        model: List.List,
        parse: function(response) {
            var models = new Array();
            for (var i=0; i<response.meta.total; i++) {
                var model = new List.List(response.objects[i]);
                models.push(model);
            }
            return models;
        },
        url: Ftask.baseApiBoard + '/' + BoardView.boardId + '/lists/'
    });

    List.ListView = Backbone.View.extend({
        tagName: "div",
        className: "list",
        template: _.template($('#list-template').html()),

        initialize: function() {
            this.listenTo(this.model, 'change:name', this.nameChanged);
            this.listenTo(this.model, 'change:order', this.orderChanged);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            var model = this.model;
            this.$el.find(".name").dblclick(function() {
                List.editNameForm($(this), model);
            });
            this.$el.find(".newcard").click(function() {
                BoardView.Task.newCardForm($(this).parent().find(".newcardform"), model);
            });
            this.$el.find(".close").click(function() {
                var token = $("#csrf_token").val();
                var url = Ftask.baseApiBoard + '/' + BoardView.boardId + '/lists/' + model.id + '/';
                var req = $.ajax({url:url + '?_csrf_token='+token, type:"DELETE"});
                req.done(function(data) {
                    List.collection.fetch({update: true});
                    Ftask.updateCsrf();
                });
                req.fail(function(data) {
                    alert("ERROR");
                    Ftask.updateCsrf();
                });
                return false;
            });

            this.$el.attr("id", model.id);
            this.$el.data("order", model.get("order"));

            return this;
        },

        nameChanged: function() {
            this.$el.find(".name").html(this.model.get("name"));
        },

        orderChanged: function() {
            this.$el.data("order", this.model.get("order"));
            updateOrder();
        }
    });

    // vars

    List.views = new Array();
    List.collection = new BoardView.List.Lists();
    List.collection.on("add", function(l) {
        var view = new List.ListView({model: l});
        var el = $(view.render().el);

        makeListDraggable(el);
        makeListDroppable(el);
        $("#list-list").append(el);

        List.views.push(view);

        // creating task views
        BoardView.Task.createTaskCollection(l);

        BoardView.resizeBoard();
    });
    List.collection.on("remove", function(l) {
        var view = _.find(List.views, function(v) { return v.model === l});
        view.remove();
        List.views = _.filter(List.views, function(v) { return v.model != l });

        // removing task views
        BoardView.Task.removeTaskCollection(l);

        BoardView.resizeBoard();
    });
    List.collection.on("change", function(l) {
        BoardView.resizeBoard();
    });


    // internal functions

    // reorder board lists
    function updateOrder() {
        var sortedList = $(".list").sort(function(a, b) { return $(a).data("order") < $(b).data("order") ? -1 : 1 });
        $("#list-list").append(sortedList);
    }

    // drag & drop

    function makeListDraggable(el) {
        $(el).draggable({
            //containment: ".board",
            handle: ".header",
            cursor: "move",
            start: dragListStart,
            stop: dragListStop,
            helper: dragListHelper
        });
    }

    function makeListDroppable(el) {
        $(el).droppable({
            over: function(e, ui) {
                var o1 = ui.draggable;
                if (o1.hasClass("task")) {
                    $(this).find(".cards").prepend(o1);
                } else {
                    var o2 = $(this);
                    if (o2.offset().left < o1.offset().left) {
                        o1.insertBefore(o2);
                    } else {
                        o1.insertAfter(o2);
                    }
                }
            },
            tolerance: "pointer"
        });

        $(el).find(".header").droppable({
            over: function(e, ui) {
                var o1 = ui.draggable;
                if (o1.hasClass("task")) {
                    $(this).parent().find(".cards").prepend(o1);
                }

            }
        });
    }

    // list drag function
    function dragListHelper(e) {
        var helper = $(this).clone();
        helper.addClass("dragging");
        helper.width($(this).width());
        return helper;
    }

    function dragListStart(e, ui) {
        $(this).addClass("dragging-freeze");
        BoardView.syncLock = true;
    }

    function dragListStop(e, ui) {
        $(this).removeClass("dragging-freeze");

        // Change model order attr and update
        $(".list").each(function(i, l) {
            var obj = $(l);
            if (!obj.hasClass("dragging")) {
                var view = _.find(List.views, function(v) { return v.model.id === obj.attr("id") });
                view.model.set({"order": i}, {silent: true});
                view.$el.data("order", i);

                var url = '/api/boards/' + BoardView.boardId + '/lists/'+view.model.id+'/';
                var token = $("#csrf_token").val();
                var data = {'_csrf_token': token, 'order': i};
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
}).call(this);
