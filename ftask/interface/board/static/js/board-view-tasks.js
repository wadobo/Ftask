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
                        sync();
                   });
    }
}).call(this);
