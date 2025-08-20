db = db.getSiblingDB('kinect');

db.createUser({
  user: 'kinectuser',
  pwd: 'kinectpass',
  roles: [
    {
      role: 'readWrite',
      db: 'kinect',
    },
  ],
});

db.createCollection('users');
db.createCollection('contacts');
db.createCollection('contactlists');
db.createCollection('communicationlogs');
