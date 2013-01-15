(function() {
    var BoardView = this.BoardView = {};
    BoardView.boardId = "";

    BoardView.unshare = function (username) {
        var url = Ftask.baseApiBoard + '/' + BoardView.boardId + '/unshare/';
        var token = $("#csrf_token").val();
        var data = {'_csrf_token': token, 'user': username};
        var req = $.ajax({url:url, data:data, type:"POST"});
        req.done(function(data) {
            Ftask.updateCsrf();
            BoardView.updateBoard();
        });
        req.fail(function(data) {
            Ftask.updateCsrf();
        });
    }

    // member Backbone

    BoardView.Member = Backbone.Model.extend({
        idAttribute: "id"
    });

    BoardView.Members = Backbone.Collection.extend({
        model: BoardView.Member,
        parse: function(response) {
            var models = new Array();
            for (var i = 0; i < response.shared.length; i++) {
                var u = response.shared[i];
                var model = new BoardView.Member(u);
                model.set("role", "member");
                models.push(model);
            }

            for (var i = 0; i < response.admins.length; i++) {
                var u = response.admins[i];
                var model = new BoardView.Member(u);
                model.set("role", "admin");
                models.push(model);
            }

            return models;
        },
        url: function () {
            return Ftask.baseApiBoard + '/' + BoardView.boardId + '/';
        }
    });

    BoardView.MemberView = Backbone.View.extend({
        tagName: "span",
        template: _.template($('#miniuser-template').html()),

        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function() {
            var m = this.model;
            var img = $.gravatar(m.get("email"), {'size': 30});
            this.$el.html(this.template({user: m.get("username"), url: img.attr("src")}));
            if (m.get("role") === "admin") {
                this.$el.find(".remove").remove();
            } else {
                this.$el.find(".remove-user").click(function() {
                    BoardView.unshare(m.get("username"));
                    return false;
                });
            }
            return this;
        },
    });

    BoardView.members = new BoardView.Members();
    BoardView.memberViews = new Array();

    BoardView.members.on("add", function(l) {
        var view = new BoardView.MemberView({model: l});
        if (l.get("role") === "admin") {
            $(".admin").append(view.render().el);
        } else {
            $(".members").append(view.render().el);
        }
        BoardView.memberViews.push(view);
    });
    BoardView.members.on("remove", function(l) {
        var view = _.find(BoardView.memberViews, function(v) { return v.model === l});
        view.remove();
        BoardView.memberViews = _.filter(BoardView.memberViews, function(v) { return v.model != l });
    });

    BoardView.updateBoard = function () {
        $.get(Ftask.baseApiBoard + '/' + BoardView.boardId + '/', function(data) {
            $(".boardname").html(data.name);
            $("title").html(data.name);
        });
        BoardView.members.fetch({update: true});
    }

    BoardView.syncLock = false;

    BoardView.sync = function() {
        if (!BoardView.syncLock) {
            BoardView.syncLock = true;
            BoardView.updateBoard();
            BoardView.List.collection.fetch({update: true});
            _.each(BoardView.Task.collections, function(tc) {
                tc.fetch({update: true});
            });
            BoardView.syncLock = false;
        }
    }

    BoardView.resizeBoard = function() {
        var size = ($(window).height() - $(".board").offset().top - 30);
        $(".board").css("height",  size + "px");

        $(".cardoverflow").css("height", "auto");

        if ($(window).width() <= 480) {
            $("#list-list").css("width", "auto");
        } else {
            var width = ($(".list").length) * ($(".list").width() + 13);
            $("#list-list").css("width", width + "px");

            var cardSize = (size - 80);
            $(".cardoverflow").each(function() {
                if ($(this).height() > cardSize)
                    $(this).css("height",  cardSize + "px");
            });
        }
    }

    $(window).resize(function() {
        BoardView.resizeBoard();
    });

}).call(this);

