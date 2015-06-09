# ilabmail
Repository for code used to power the data visualisation UQ's ilab system

#### Requirements:
```
Python 2.7 w/ pip
Node.js w/ npm
MongoDB
```

#### Installation:
- cd to the directory you would like the repository to be created in.
- git clone https://github.com/no1mzb/ilabmail
- cd ilabmail
- npm install .
- Ensure that a mongod process is running.
- sudo pip install --upgrade google-api-python-client python-gflags paho-mqtt pymongo
- sudo cp services/UQilabmail-* /etc/init.d/
- sudo service UQilabmail-mongo start && sudo service UQilabmail-read start
- cd data_generator && node app.js &
- cd ../webapp
- node server.js

#### Use
