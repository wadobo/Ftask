#!/usr/bin/env python

from __future__ import division, absolute_import
from ...tests.base import BaseTestCase


class UserTestCase(BaseTestCase):

    def test_users_register(self):
        # Bad data
        data = { 'username': 'danigm' }
        res = self.app.post('/api/users/register/', data=data)
        self.assertEqual(res.status_code, 400)

        # all ok
        data = { 'username': 'danigm',
                 'password': '123',
                 'email': 'danigm@wadobo.com'}
        res = self.app.post('/api/users/register/', data=data)
        self.assertEqual(res.status_code, 200)

        # already registered user
        res = self.app.post('/api/users/register/', data=data)
        self.assertEqual(res.status_code, 400)
