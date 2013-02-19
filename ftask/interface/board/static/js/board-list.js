(function() {
    var BoardList = this.BoardList = {};

    BoardList.Board = Backbone.Model.extend({
        idAttribute: "id"
    });

    BoardList.Boards = Backbone.Collection.extend({
        model: BoardList.Board,
        parse: function(response) {
            var models = new Array();
            for (var i=0; i<response.meta.total; i++) {
                var model = new BoardList.Board(response.objects[i]);
                models.push(model);
            }
            return models;
        },
        url: Ftask.baseApiBoard + '/'
    });

    BoardList.BoardView = Backbone.View.extend({
        tagName: "li",
        template: _.template($('#board-template').html()),

        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function() {
            var m = this.model;
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.find(".close").click(function() {
                BoardList.deleteBoard(Ftask.baseApiBoard + '/' + m.id + '/');
                return false;
            });
            return this;
        },
    });

    // Shared boards backbone
    BoardList.SharedBoard = Backbone.Model.extend({
        idAttribute: "id"
    });

    BoardList.SharedBoards = Backbone.Collection.extend({
        model: BoardList.SharedBoard,
        parse: function(response) {
            var models = new Array();
            for (var i=0; i<response.meta.total; i++) {
                var model = new BoardList.SharedBoard(response.objects[i]);
                models.push(model);
            }
            return models;
        },
        url: Ftask.baseApiBoard + '/shared/'
    });

    BoardList.deleteBoard = function(url) {
        Ftask.csrf_ajax({url:url, type:"DELETE"},
                        function (data) {
                            BoardList.boards.fetch({update: true});
                        });
    }

    BoardList.boards = new BoardList.Boards();
    BoardList.views = new Array();

    BoardList.boards.on("add", function(l) {
        var view = new BoardList.BoardView({model: l});
        $("#board-list").append(view.render().el);
        BoardList.views.push(view);
    });
    BoardList.boards.on("remove", function(l) {
        var view = _.find(BoardList.views, function(v) { return v.model === l});
        view.remove();
        BoardList.views = _.filter(BoardList.views, function(v) { return v.model != l });
    });

    // shared boards
    BoardList.sharedBoards = new BoardList.SharedBoards();
    BoardList.sharedViews = new Array();
    BoardList.sharedBoards.on("add", function(l) {
        var view = new BoardList.BoardView({model: l});
        $("#shared-list").append(view.render().el);
        BoardList.sharedViews.push(view);
    });
    BoardList.sharedBoards.on("remove", function(l) {
        var view = _.find(BoardList.sharedViews, function(v) { return v.model === l});
        view.remove();
        BoardList.sharedViews = _.filter(BoardList.sharedViews, function(v) { return v.model != l });
    });

    BoardList.initialize = function() {
        BoardList.boards.fetch({update: true});
        BoardList.sharedBoards.fetch({update: true});

        Ftask.form("#board-form",
                   function(data) {
                        alert("ERROR");
                   },
                   function(data) {
                        BoardList.boards.fetch({update: true});
                        $("#modal").modal("hide");
                   });

        setInterval('BoardList.boards.fetch({update: true})', 5000);
        setInterval('BoardList.sharedBoards.fetch({update: true})', 5000);
    }
}).call(this);
