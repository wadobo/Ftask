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

from flask import abort
from flask import jsonify
from flask import request
from flask import session
from flask import g
from ..db import get_db, to_json
from ..auth.decorators import authenticated

from bson.objectid import ObjectId


@authenticated
def list_boards():
    boards = get_db().boards.find({'user': g.user['username']}).sort([('name', 1)])
    meta = {}
    meta['total'] = boards.count()
    objs = [to_json(i) for i in boards]

    return jsonify(meta=meta,
                   objects=objs)
list_boards.path = '/'


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

    from .list_views import add_list
    add_list(board, 'TODO')
    add_list(board, 'DOING')
    add_list(board, 'DONE')

    c.insert(board)

    return jsonify(status="success")
new_board.path = '/new/'
new_board.methods = ['POST']


@authenticated
def view_board(boardid):
    b = get_board_by_id(boardid)
    if request.method == 'GET':
        return jsonify(to_json(b))
    elif request.method == 'PUT':
        update_board(b, g.user, request.form)
    elif request.method == 'DELETE':
        delete_board(b, g.user)

    return jsonify(status="success")
view_board.path = '/<boardid>/'
view_board.methods = ['GET', 'PUT', 'DELETE']


# utils #

def update_board(board, user, newdata):
    if not board['user'] == user['username']:
        raise abort(401)

    board['name'] = newdata['name']
    get_db().boards.save(board)


def delete_board(board, user):
    if not board['user'] == user['username']:
        raise abort(401)

    get_db().boards.remove(board)


def get_board_by_id(boardid):
    c = get_db().boards
    b = c.find_one({'_id': ObjectId(boardid),
                    'user': g.user['username']})

    if not b:
        raise abort(404)

    return b
