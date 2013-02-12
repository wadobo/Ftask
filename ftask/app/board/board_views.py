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
from functools import wraps


def can_view_board(view):
    @wraps(view)
    def deco_view(boardid, *args, **kwargs):
        board = get_board_by_id(boardid)
        is_creator = board['user'] == g.user['username']
        can_view = g.user['username'] in board.get('shared', [])
        if not is_creator and not can_view:
            raise abort(401)

        return view(boardid, *args, **kwargs)

    return deco_view


def can_view_assigned(view):
    @wraps(view)
    def deco_view(userid, *args, **kwargs):
        if not userid == g.user['username']:
            raise abort(401)

        return view(userid, *args, **kwargs)
    
    return deco_view

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
def shared_boards():
    boards = get_db().boards.find({'shared': g.user['username']}).sort([('name', 1)])
    meta = {}
    meta['total'] = boards.count()
    objs = [to_json(i) for i in boards]

    return jsonify(meta=meta,
                   objects=objs)
shared_boards.path = '/shared/'


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
@can_view_board
def view_board(boardid):
    b = get_board_by_id(boardid)

    if request.method == 'GET':
        s = b.get('shared', [])
        b['shared'] = [to_json(u, excludes=['password']) for u in get_db().users.find({"username": {"$in": s}})]
        b['admins'] = [to_json(u, excludes=['password']) for u in get_db().users.find({"username": b['user']})]
        return jsonify(to_json(b))
    elif request.method == 'PUT':
        update_board(b, g.user, request.form)
    elif request.method == 'DELETE':
        delete_board(b, g.user)

    return jsonify(status="success")
view_board.path = '/<boardid>/'
view_board.methods = ['GET', 'PUT', 'DELETE']


@authenticated
@can_view_board
def share_board(boardid):
    b = get_board_by_id(boardid)

    # not with the same name
    user = request.form['user']
    shared = b.get('shared', [])
    if user in shared or user == b['user']:
        return jsonify(status="success")

    b['shared'] = b.get('shared', []) + [user]
    get_db().boards.save(b)

    return jsonify(status="success")
share_board.path = '/<boardid>/share/'
share_board.methods = ['POST']


@authenticated
@can_view_board
def unshare_board(boardid):
    b = get_board_by_id(boardid)

    # not with the same name
    user = request.form['user']
    l = b.get('shared', [])
    l.remove(user)
    b['shared'] = l
    get_db().boards.save(b)

    return jsonify(status="success")
unshare_board.path = '/<boardid>/unshare/'
unshare_board.methods = ['POST']


# utils #

def update_board(board, user, newdata):
    board['name'] = newdata['name']
    get_db().boards.save(board)


def delete_board(board, user):
    get_db().boards.remove({'_id': board['_id']})


def get_board_by_id(boardid):
    c = get_db().boards
    b = c.find_one({'_id': ObjectId(boardid)})

    if not b:
        raise abort(404)

    return b
