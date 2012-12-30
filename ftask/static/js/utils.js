function ftask_form(id, onerror, onsuccess) {
    $(id).submit(function() {
        var url = $(id).data("url");
        var data = $(id).serialize();

        // TODO loading
        var req = $.post(url, data);

        // DONE
        req.done(function(data) {
            var next = $(id).data("next");
            if (next && data.status === "success") {
                window.location.href = next;
            } else {
                onsuccess(data);
            }
        });

        // ERROR
        req.fail(function(data) {
            onerror(data);
        });

        return false;
    });
}
