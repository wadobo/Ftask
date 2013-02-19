(function() {
    var Ftask = this.Ftask = {};

    Ftask.baseApi = '/api';
    Ftask.baseApiAuth = Ftask.baseApi + '/users';
    Ftask.baseApiBoard = Ftask.baseApi + '/boards';

    Ftask.ldg = 0;
    // Shows a  loading animation
    Ftask.loading = function (loading) {
        if (loading) {
            Ftask.ldg++;
            $("#mini-loading").fadeIn();
        } else {
            Ftask.ldg--;
            if (Ftask.ldg <= 0) {
                $("#mini-loading").fadeOut();
                Ftask.ldg = 0;
            }
        }
    }

    // Queries the csrf token to the api
    Ftask.updateCsrf = function () {
        Ftask.loading(true);
        var req = $.get(Ftask.baseApiAuth + '/csrf_token/', {}, function(data) {
            $("#csrf_token").val(data.token);
            Ftask.loading(false);
        });
    }

    Ftask.csrf_ajax = function (options, done, fail) {
        Ftask.loading(true);
        var req = $.get(Ftask.baseApiAuth + '/csrf_token/', {}, function(data) {
            var token = data.token;
            if (options.data === undefined) {
                options.data = {};
            }
            if (options.type === 'GET' || options.type === 'DELETE') {
                options.url += '?_csrf_token=' + token;
            } else {
                options.data._csrf_token = token;
            }

            var req = $.ajax(options);
            req.done(done);
            if (fail === undefined) {
                req.fail(function(data) {
                    alert('ERROR');
                });
            } else {
                req.fail(fail);
            }

            Ftask.loading(false);
        });
    }

    // Convert a html form in a ajax query to the api
    Ftask.form = function (id, onerror, onsuccess) {

        function done () {
            if ($("#csrf_token").length) {
                Ftask.updateCsrf();
            }
            $("#loading").fadeOut();
        }

        $(id).unbind('submit').submit(function() {
            var url = $(id).data("url");
            var data = $(id).serialize();
            var method = $(id).attr("method");

            if ($("#csrf_token").length) {
                data += "&_csrf_token="+$("#csrf_token").val();
            }

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

                done();
            });

            // ERROR
            req.fail(function(data) {
                onerror(data);
                done();
            });

            return false;
        });
    }

}).call(this);
