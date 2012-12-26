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
from flask import jsonify
from flask import request
from ..db import get_db, to_json

from hashlib import sha256


auth = Blueprint('auth', __name__, template_folder='templates')


@auth.route('/')
def list_users():
    users = get_db().users.find()
    meta = {}
    meta['total'] = users.count()
    objs = [to_json(i) for i in users]

    return jsonify(meta=meta,
                   objects=objs)


@auth.route('/register/', methods=['POST'])
def register():
    c = get_db().users
    username = request.form['username']
    pw = sha256(request.form['password']).hexdigest()
    email = request.form['email']

    u = {'username': username,
         'password': pw,
         'email': email}

    if get_db().users.find({"username": username}).count():
        raise abort(400)

    c.insert(u)

    return jsonify(status="success")
