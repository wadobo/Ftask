function ftask_update_csrf() {
    var req = $.get('/api/users/csrf_token/', {}, function(data) {
        $("#csrf_token").val(data.token);
    });
}

function ftask_form(id, onerror, onsuccess) {
    $(id).submit(function() {
        var url = $(id).data("url");
        var data = $(id).serialize();
        data += "&_csrf_token="+$("#csrf_token").val();

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
            ftask_update_csrf();
        });

        // ERROR
        req.fail(function(data) {
            onerror(data);
            ftask_update_csrf();
        });

        return false;
    });
}
