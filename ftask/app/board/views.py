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


board = Blueprint('board', __name__, template_folder='templates')

##########
# BOARDS #
##########

from .board_views import list_boards
from .board_views import view_board
from .board_views import new_board
from .board_views import share_board
from .board_views import unshare_board

board.add_url_rule(list_boards.path, 'boards', list_boards)
board.add_url_rule(new_board.path, 'new_board', new_board)
board.add_url_rule(view_board.path, 'view_board', view_board)
board.add_url_rule(share_board.path, 'share_board', share_board)
board.add_url_rule(unshare_board.path, 'unshare_board', unshare_board)

###############
# BOARD LISTS #
###############

from .list_views import view_board_lists
from .list_views import view_board_list
from .list_views import new_board_list

board.add_url_rule(view_board_lists.path, 'lists', view_board_lists)
board.add_url_rule(new_board_list.path, 'new_list', new_board_list)
board.add_url_rule(view_board_list.path, 'view_list', view_board_list)

###############
# LISTS TASKS #
###############

from .task_views import view_board_tasks
from .task_views import view_list_tasks
from .task_views import view_list_task
from .task_views import new_list_task

board.add_url_rule(view_board_tasks.path, 'tasks', view_board_tasks)
board.add_url_rule(view_list_tasks.path, 'list_tasks', view_list_tasks)
board.add_url_rule(view_list_task.path, 'view_task', view_list_task)
board.add_url_rule(new_list_task.path, 'new_task', new_list_task)
