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
from ..db import get_db, to_json
from ..auth.decorators import authenticated
from .board_views import get_board_by_id

from bson.objectid import ObjectId


@authenticated
def view_board_tasks(boardid):
    c = get_db().tasks
    t = c.find({'boardid': boardid}).sort([('order', 1)])
    meta = {}
    meta['total'] = t.count()
    objs = [to_json(i) for i in t]

    return jsonify(meta=meta,
                   objects=objs)
view_board_tasks.path = '/<boardid>/tasks/'


@authenticated
def view_list_tasks(boardid, listid):
    c = get_db().tasks
    t = c.find({'listid': listid}).sort([('order', 1)])
    meta = {}
    meta['total'] = t.count()
    objs = [to_json(i) for i in t]

    return jsonify(meta=meta,
                   objects=objs)
view_list_tasks.path = '/<boardid>/lists/<listid>/tasks/'


@authenticated
def new_list_task(boardid, listid):
    c = get_db().tasks
    description = request.form['description']
    order = c.find({'boardid': boardid, 'listid': listid}).count()

    t = {
        'boardid': boardid,
        'listid': listid,
        'description': description,
        'order': order,
    }

    c.insert(t)

    return jsonify(status="success")
new_list_task.path = '/<boardid>/lists/<listid>/tasks/new/'
new_list_task.methods = ['POST']


@authenticated
def view_list_task(boardid, listid, taskid):
    c = get_db().tasks
    t = c.find_one({'_id': ObjectId(taskid)})

    b = task_board(t)
    if not b['user'] == g.user['username']:
        raise abort(404)

    if request.method == 'GET':
        return jsonify(to_json(t))
    elif request.method == 'PUT':
        update_task(t, g.user, request.form)
    elif request.method == 'DELETE':
        delete_task(t, g.user)

    return jsonify(status="success")
view_list_task.path = '/<boardid>/lists/<listid>/tasks/<taskid>/'
view_list_task.methods = ['GET', 'PUT', 'DELETE']


def task_board(t):
    c = get_db().boards
    return get_board_by_id(t['boardid'])


def task_list(t):
    c = get_db().boards
    b = get_board_by_id(t['boardid'])
    for l in b.get('lists', []):
        if l['id'] == t['listid']:
            return l
    return None


def update_task(task, user, newdata):
    for k, v in newdata.items():
        task[k] = v

    get_db().tasks.save(task)


def delete_task(task, user):
    get_db().tasks.remove({'_id': task['_id']})
