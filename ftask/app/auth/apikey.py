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

from ..db import get_db

import string
import random
import datetime


def generate_apikey():
    choices = string.ascii_letters + string.digits + string.punctuation
    k = ''.join(random.choice(choices) for x in range(20))
    return {'updated': datetime.datetime.now(), 'key': k}


def remove_old_apikeys(username):
    db = get_db()
    apikey_collection = db.apikeys

    keys = apikey_collection.find_one({'user': username})
    if not keys:
        return

    c = get_db().apikey_collection

    newks = []
    for k in keys['keys']:
        if valid_apikey(k):
            newks.append(k)
    keys['keys'] = newks

    c.save(keys)


def valid_apikey(apikey):
    d = datetime.datetime.now()
    return apikey['updated'] > d + datetime.timedelta(-1)


def new_user_apikey(u):
    remove_old_apikeys(u['username'])

    db = get_db()
    apikey_collection = db.apikeys

    keys = apikey_collection.find_one({'user': u['username']})

    apikey = generate_apikey()
    if not keys:
        newapi = {'user': u['username'], 'keys': [apikey]}
        apikey_collection.insert(newapi)
    else:
        keys['keys'].append(apikey)
        apikey_collection.save(keys)

    return apikey
