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


def set_perm(perm_type, user, objid):
    # testing first
    if test_perm(perm_type, user, objid):
        return

    c = get_db().perms
    perm = {
            'type': perm_type,
            'user': user['username'],
            'obj': objid
           }
    c.insert(perm)


def del_perm(perm_type, user, objid):
    c = get_db().perms
    perm = {
            'user': user['username'],
            'obj': objid
           }
    if perm_type != "ALL":
        perm['type'] = perm_type

    c.remove(perm)


def test_perm(perm_type, user, objid):
    if not user:
        return False

    c = get_db().perms
    perm = {
            'type': perm_type,
            'user': user['username'],
            'obj': objid
           }
    return bool(c.find_one(perm))
