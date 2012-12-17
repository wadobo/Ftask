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
from flask import abort
from flask import jsonify, json
from flask import request
from flask import render_template
from pymongo import MongoClient

from hashlib import sha256


# configuration
DEBUG = True
DATABASE = 'ftask'
SECRET_KEY = 'development key'

# create our little application :)
app = Flask(__name__)
app.config.from_object(__name__)
app.config.from_envvar('FTASK_SETTINGS', silent=True)


def get_db():
    return MongoClient()[app.config['DATABASE']]


def to_json(mongo_obj, excludes=[]):
    copy = mongo_obj.copy()
    id = copy.pop('_id')
    copy['id'] = id.binary.encode("hex")
    for k in excludes:
        del copy[k]
    return copy


# VIEWS
@app.route('/')
def index():
    return render_template('index.html')

# API

@app.route('/api/users/')
def users():
    users = get_db().users.find()
    meta = {}
    meta['total'] = users.count()
    objs = [to_json(i) for i in users]

    return jsonify(meta=meta,
                   objects=objs)


@app.route('/api/users/register/', methods=['POST'])
def users_register():
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


if __name__ == "__main__":
    app.run()
