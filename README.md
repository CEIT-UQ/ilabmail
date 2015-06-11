# ilabmail
Repository for code used to power the data visualisation UQ's ilab system

#### Requirements:
```
Python 2.7 w/ pip
Node.js w/ npm
MongoDB
```

### Installation:
- cd to the directory you would like the repository to be created in.
- git clone https://github.com/no1mzb/ilabmail
- cd ilabmail
- npm install .
- Ensure that a mongod process is running.
- sudo pip install --upgrade google-api-python-client python-gflags paho-mqtt pymongo
- sudo cp services/UQilabmail-* /etc/init.d/
- sudo service UQilabmail-mongo start && sudo service UQilabmail-read start
- cd ../webapp
- node server.js

If server.js starts with no errors then you should be able to access the webpage on
http://localhost:55672

### Scripts

	##### repairMongo.js
	This script has been used to repair the data stored in the database. 
	If using the latest version of this repo, this should need to be run ever

	##### Resultstomongo.py
	This was used to create a database from an xml file containing more indepth information about the RadioactivityVs'x' Laboratory.
	It is hoped that this information would provide an excellent starting point for
	a more targetted dashboard.
