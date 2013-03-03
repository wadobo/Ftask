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
from .board_views import can_view_board, can_view_assigned

from bson.objectid import ObjectId
from datetime import datetime
from markdown import markdown

@authenticated
@can_view_board
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
@can_view_assigned
def assigned_tasks(userid):
    c = get_db().tasks
    t = c.find({'assign' : userid})

    meta = {'total' : t.count()}

    objs = [to_json(i) for i in t]

    return jsonify(meta=meta, objects=objs)
assigned_tasks.path = '/assigned/<userid>'

@authenticated
@can_view_board
def view_list_tasks(boardid, listid):
    c = get_db().tasks
    t = c.find({'listid': listid}).sort([('order', 1)])
    meta = {}
    meta['total'] = t.count()
    objs = [serialize_task(i) for i in t]

    return jsonify(meta=meta,
                   objects=objs)
view_list_tasks.path = '/<boardid>/lists/<listid>/tasks/'

@authenticated
@can_view_board
def view_list_dates(boardid, listid):
    if listid == "all":
        query = {'boardid': boardid}
    else:
        query = {'boardid': boardid, 'listid': listid}

    max_date = get_db().tasks.find(query).sort('due_date', -1).limit(1)
    min_date = get_db().tasks.find(query).sort('due_date', 1).limit(1)

    meta = {}
    
    if max_date.count() == 0 or min_date.count() == 0:
        meta['unlimited'] = 1
    else:
        meta['unlimited'] = 0

    
    objs = {
        'min_date': None if min_date.count() == 0 else min_date.next()['due_date'].isoformat(),
        'max_date': None if max_date.count() == 0 else max_date.next()['due_date'].isoformat(),
        }
    
    return jsonify(meta=meta, objects=objs)
view_list_dates.path = "/<boardid>/lists/<listid>/tasks/dates"

@authenticated
@can_view_board
def new_list_task(boardid, listid):
    c = get_db().tasks
    description = request.form['description']
    (m, d, y) = request.form['due_date'].split('/')
    order = c.find({'boardid': boardid, 'listid': listid}).count()

    t = {
        'boardid': boardid,
        'listid': listid,
        'description': description,
        'due_date' : datetime(int(y), int(m), int(d)),
        'order': order,
    }

    c.insert(t)

    return jsonify(status="success")
new_list_task.path = '/<boardid>/lists/<listid>/tasks/new/'
new_list_task.methods = ['POST']


@authenticated
@can_view_board
def view_list_task(boardid, listid, taskid):
    c = get_db().tasks
    t = c.find_one({'boardid': boardid, '_id': ObjectId(taskid)})

    if request.method == 'GET':
        if not t:
            raise abort(404)
        return jsonify(serialize_task(t))
    elif request.method == 'PUT':
        update_task(t, g.user, request.form)
    elif request.method == 'DELETE':
        delete_task(t, g.user)

    return jsonify(status="success")
view_list_task.path = '/<boardid>/lists/<listid>/tasks/<taskid>/'
view_list_task.methods = ['GET', 'PUT', 'DELETE']


@authenticated
@can_view_board
def comment_task(boardid, listid, taskid):
    c = get_db().tasks
    t = c.find_one({'boardid': boardid,
                    'listid': listid,
                    '_id': ObjectId(taskid)})

    md = markdown(request.form['comment'], safe_mode='escape')
    if not t:
        raise abort(404)

    t['comments'] = t.get('comments', []) + [{'content' : md,
                                              'user' : g.user['username']}]
    
    c.save(t)

    return jsonify(status="success")
comment_task.path = '/<boardid>/lists/<listid>/tasks/<taskid>/comment/'
comment_task.methods = ['PUT']

@authenticated
@can_view_board
def assign_task(boardid, listid, taskid):
    c = get_db().tasks
    t = c.find_one({'boardid': boardid, 'listid': listid, '_id': ObjectId(taskid)})
    if not t:
        raise abort(404)

    # not with the same name
    user = request.form['user']
    assign = t.get('assign', [])
    if user in assign:
        return jsonify(status="success")

    t['assign'] = t.get('assign', []) + [user]
    c.save(t)

    return jsonify(status="success")
assign_task.path = '/<boardid>/lists/<listid>/tasks/<taskid>/assign/'
assign_task.methods = ['POST']


@authenticated
@can_view_board
def unassign_task(boardid, listid, taskid):
    c = get_db().tasks
    t = c.find_one({'boardid': boardid, 'listid': listid, '_id': ObjectId(taskid)})
    if not t:
        raise abort(404)

    # not with the same name
    user = request.form['user']
    l = t.get('assign', [])
    l.remove(user)
    t['assign'] = l
    c.save(t)

    return jsonify(status="success")
unassign_task.path = '/<boardid>/lists/<listid>/tasks/<taskid>/unassign/'
unassign_task.methods = ['POST']


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
        if k == "order":
            task[k] = int(v)
        elif k == "due_date":
            task[k] = datetime.strptime(request.form['due_date'],
                                        "%Y-%m-%dT%H:%M:%S.%f")
        else:
            task[k] = v

    get_db().tasks.save(task)


def delete_task(task, user):
    get_db().tasks.remove({'_id': task['_id']})


def serialize_task(t):
    s = t.get('assign', [])
    t['assign'] = [to_json(u, excludes=['password']) for u in get_db().users.find({"username": {"$in": s}})]

    c = t.get('comments', [])
    t['comments'] = [{'user': e[0], 'comment' : e[1]} for e in [[to_json(get_db().users.find({'username': i['user']}).next(), excludes=['password']), i['content']] for i in c]]
    
    serialized = to_json(t)

    return serialized
