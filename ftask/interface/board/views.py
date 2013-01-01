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
from flask import render_template
from ..auth.decorators import authenticated


boardi = Blueprint('boardi', __name__,
                   template_folder='templates',
                   static_folder='static')


@boardi.route('/', methods=['GET'])
@authenticated
def list_board():
    return render_template('board/list.html', selected="board")


@boardi.route('/<boardid>', methods=['GET'])
@authenticated
def view_board(boardid):
    return render_template('board/view.html', boardid=boardid)
