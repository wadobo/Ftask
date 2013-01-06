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
                        sync();
                   });
    }
}).call(this);
