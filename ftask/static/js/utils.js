var ldg = 0;
function ftask_loading(loading) {
    if (loading) {
        ldg++;
        $("#mini-loading").fadeIn();
    } else {
        ldg--;
        if (ldg <= 0) {
            $("#mini-loading").fadeOut();
            ldg = 0;
        }
    }
}

function ftask_update_csrf() {
    ftask_loading(true);
    var req = $.get('/api/users/csrf_token/', {}, function(data) {
        $("#csrf_token").val(data.token);
        ftask_loading(false);
    });
}

function ftask_form(id, onerror, onsuccess) {
    $(id).submit(function() {
        var url = $(id).data("url");
        var data = $(id).serialize();
        var method = $(id).attr("method");
        data += "&_csrf_token="+$("#csrf_token").val();

        $("#loading").fadeIn();
        var req = $.ajax({url:url, data:data, type:method});

        // DONE
        req.done(function(data) {
            var next = $(id).data("next");
            if (next && data.status === "success") {
                window.location.href = next;
            } else {
                onsuccess(data);
            }
            ftask_update_csrf();
            $("#loading").fadeOut();
        });

        // ERROR
        req.fail(function(data) {
            onerror(data);
            ftask_update_csrf();
            $("#loading").fadeOut();
        });

        return false;
    });
}
