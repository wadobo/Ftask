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
from flask import g
from ..db import get_db
from ..auth.decorators import authenticated
from .board_views import get_board_by_id

from bson.objectid import ObjectId


@authenticated
def view_board_lists(boardid):
    b = get_board_by_id(boardid)
    ls = b.get('lists', [])
    meta = {}
    meta['total'] = len(ls)

    return jsonify(meta=meta,
                   objects=ls)
view_board_lists.path = '/<boardid>/lists/'


@authenticated
def new_board_list(boardid):
    c = get_db().boards
    b = get_board_by_id(boardid)
    name = request.form['name']

    add_list(b, name)
    c.save(b)

    return jsonify(status="success")
new_board_list.path = '/<boardid>/lists/new/'
new_board_list.methods = ['POST']


@authenticated
def view_board_list(boardid, listid):
    b = get_board_by_id(boardid)
    if request.method == 'GET':
        for l in b.get('lists', []):
            if l['id'] == listid:
                return jsonify(l)
        raise abort(404)
    elif request.method == 'PUT':
        update_board_list(b, listid, g.user, request.form)
    elif request.method == 'DELETE':
        delete_board_list(b, listid, g.user)

    return jsonify(status="success")
view_board_list.path = '/<boardid>/lists/<listid>/'
view_board_list.methods = ['GET', 'PUT', 'DELETE']


def update_board_list(board, lid, user, newdata):
    if not board['user'] == user['username']:
        raise abort(401)

    for l in board.get('lists', []):
        if l['id'] == lid:
            l['name'] = newdata['name']

    get_db().boards.save(board)


def delete_board_list(board, lid, user):
    if not board['user'] == user['username']:
        raise abort(401)

    index = -1
    for i, l in enumerate(board.get('lists', [])):
        if l['id'] == lid:
            index = i
            break

    if index >= 0:
        ls = board.get('lists', [])
        ls.pop(index)

    get_db().boards.save(board)


def add_list(board, name):
    ls = {'name': name, 'id': ObjectId().binary.encode("hex")}

    # not with the same name
    for l in board.get('lists', []):
        if name == l['name']:
            raise abort(400)

    board['lists'] = board.get('lists', []) + [ls]
