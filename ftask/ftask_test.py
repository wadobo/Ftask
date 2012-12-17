#!/usr/bin/env python

import os
import ftask
import unittest
import tempfile

from pymongo import MongoClient

class FtaskTestCase(unittest.TestCase):

    def setUp(self):
        ftask.app.config['DATABASE'] = 'ftask_test'
        ftask.app.config['TESTING'] = True
        self.app = ftask.app.test_client()

    def tearDown(self):
        MongoClient().drop_database('ftask_test')

    def test_users_register(self):
        data = { 'username': 'danigm' }
        res = self.app.post('/api/users/register/', data=data)
        self.assertEqual(res.status_code, 400)

        data = { 'username': 'danigm',
                 'password': '123',
                 'email': 'danigm@wadobo.com'}
        res = self.app.post('/api/users/register/', data=data)
        self.assertEqual(res.status_code, 200)

if __name__ == '__main__':
    unittest.main()
