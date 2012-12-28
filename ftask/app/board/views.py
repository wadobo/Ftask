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
from flask import session
from flask import g
from ..db import get_db, to_json
from ..auth.decorators import authenticated


board = Blueprint('board', __name__, template_folder='templates')


@board.route('/')
@authenticated
def list_boards():
    boards = get_db().boards.find({'user': g.user['username']})
    meta = {}
    meta['total'] = boards.count()
    objs = [to_json(i) for i in boards]

    return jsonify(meta=meta,
                   objects=objs)


@board.route('/new/', methods=['POST'])
@authenticated
def new_board():
    c = get_db().boards
    name = request.form['name']
    # TODO board owned by user or org
    #org = request.form['org']

    board = {'name': name,
             'user': g.user['username']}

    if c.find(board).count():
        raise abort(400)

    c.insert(board)

    return jsonify(status="success")
