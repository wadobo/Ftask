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

from flask import Blueprint
from flask import abort
from flask import request
from flask import session
from flask import redirect
from flask import g
from flask import render_template
from flask import url_for
from .decorators import authenticated


authi = Blueprint('authi', __name__,
                  template_folder='templates',
                  static_folder='static')


@authi.route('/register/', methods=['GET'])
def register():
    return render_template('auth/register.html')


@authi.route('/login/', methods=['GET'])
def login():
    nxt = request.args.get('next', url_for('.profile'))
    if g.user:
        return redirect(url_for('.profile'))
    return render_template('auth/login.html', next=nxt)


@authi.route('/profile/', methods=['GET'])
@authenticated
def profile():
    return render_template('auth/profile.html', user=g.user, selected="profile")
