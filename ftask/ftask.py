# Ftask, simple TODO list application
# Copyright (C) 2012 Daniel Garcia <danigm@wadobo.com>

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

from __future__ import division, absolute_import

from flask import Flask
from flask import render_template
from app.auth.views import auth, auth_before_request
from app.auth.views import csrf_token
from app.board.views import board


from interface.auth.views import authi
from interface.board.views import boardi


# configuration
DEBUG = True
DATABASE = 'ftask'
SECRET_KEY = 'development key'

# create our little application :)
app = Flask(__name__)
app.config.from_object(__name__)
app.config.from_envvar('FTASK_SETTINGS', silent=True)


@app.before_request
def before_request():
    auth_before_request()


app.jinja_env.globals['csrf_token'] = csrf_token


# api blueprints
app.register_blueprint(auth, url_prefix='/api/users')
app.register_blueprint(board, url_prefix='/api/boards')

# interface blueprints
app.register_blueprint(authi, url_prefix='/auth')
app.register_blueprint(boardi, url_prefix='/board')


# basic views
@app.route('/')
def index():
    return render_template('index.html')


if __name__ == "__main__":
    app.run()
