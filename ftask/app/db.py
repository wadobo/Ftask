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

from flask import current_app as app

from pymongo import MongoClient


def get_db():
    return MongoClient()[app.config['DATABASE']]


def to_json(mongo_obj, excludes=[]):
    copy = mongo_obj.copy()
    id = copy.pop('_id')
    copy['id'] = id.binary.encode("hex")
    for k in excludes:
        del copy[k]
    return copy
