# Python 2.7

# This script is simply to add the information provided by the RadioactivityvsDistance experiment to the Mongodb.
import xmltodict
import pymongo, json
from pymongo import MongoClient

f = open("Radioactivity_Results.xml", 'r')
xml = f.read()
doc = xmltodict.parse(xml)
results = doc['experimentResults']['experimentResult']

## Make things just a normal dict
new = []
for result in results:
    temp = {}
    for entry in result:
        temp[entry] = result[entry]
    new.append(temp)

## Sort the Distances
for i in range(0, len(new)):
    temp = new[i]['distance']
    tempint = []
    if isinstance(temp, basestring):
        tempstr = temp.split(',')
        for j in tempstr: # convert str's to int's
            tempint.append(int(j))
    new[i]['distance'] = tempint

## Sort the DataVector component
for i in range(0, len(new)):
    toReturn = {}
    temp = new[i]['dataVector']

    if temp == None:
        for d in range(0, len(new[i]['distance'])):
            toReturn[str(new[i]['distance'][d])] = int("-1")
        new[i]['dataVector'] = toReturn
        continue

    elif isinstance(temp, list) and isinstance(temp[0], basestring):
        for dist in range(0, len(temp)):
            l = temp[dist].split(',')
            tints = []
            for j in l:
                tints.append(int(j))
            toReturn[str(new[i]['distance'][dist])] = tints

    elif isinstance(temp, dict):
        l = temp["#text"].split(',')
        tints = []
        for j in l:
            tints.append(int(j))
        toReturn[str(temp["@distance"])] = tints

    elif isinstance(temp, list) and isinstance(temp[0], dict):
        # Using the system adopted later in the xml file. -.-
        for dset in range(0, len(temp)):
            l = temp[dset]["#text"].split(',')
            tints = []
            for j in l:
                tints.append(int(j))
            toReturn[str(temp[dset]["@distance"])] = tints

    else: #If it's a string that means there's only one distance point
        l = temp.split(',')
        tints = []
        for j in l:
            tints.append(int(j))
        toReturn[str(new[i]['distance'][0])] = tints

    new[i]['dataVector'] = toReturn

def isnum(n):
    try:
        int(n)
    except:
        return False
    return True

final = []
# Take out the Date and Time values for checking against the mongo.
for i in new:
    temp = {
                "data-experimentId":i["experimentId"],
                "data-setupName":i["setupName"],
                "data-sourceName":i["sourceName"],
                "data-absorberName":i['absorberName'],
                "data-numDistance":len(i['distance']),
                "data-distance": i['distance'],
                'data-repeat': int(i['repeat']),
                'data-results':i['dataVector']
            }

    # Format all the the different variants of time:
    # Tuesday, 28 April 2009 1:57:09 AM
    # Fri 28 Aug 2009 4:46:20 AM
    # Mon Feb 24 08:47:35 GMT+10:00 2014

    # Need to convert it to:
    # Date = Thu, 12 Mar 2015
    # Time = 20:04:27 +1000

    # find which format it is
    t = i['timestamp'].split()

    if len(t[0]) > 3: # 1st variant
        temp["Date"] = t[0][:3]+", "+t[1]+" "+t[2][:3]+" "+t[3]
        a = t[4].split(':') # split time
        if len(a[0]) == 1: a[0] = '0' + a[0] # fix first digit
        if t[5] == 'PM':
            temp["Time"] = str(int(a[0])+12)+':'+a[1]+':'+a[2]+" +1000"
        else:    
            temp["Time"] = a[0]+':'+a[1]+':'+a[2]+" +1000"

    elif isnum(t[1]): # 2nd variant
        temp["Date"] = t[0]+", "+t[1]+" "+t[2]+" "+t[3]
        a = t[4].split(':') # split time
        if len(a[0]) == 1: a[0] = '0' + a[0] # fix first digit
        if t[5] == 'PM':
            temp["Time"] = str(int(a[0])+12)+':'+a[1]+':'+a[2]+" +1000"
        else:    
            temp["Time"] = a[0]+':'+a[1]+':'+a[2]+" +1000"

    else: # 3rd Variant
        temp["Date"] = t[0]+", "+t[2]+" "+t[1]+" "+t[5]
        temp["Time"] = t[3]+" "+"+1000"

    final.append(temp)

# Now we check all the docs in mongo for a match and print out how many we got.
# this will take a while and we'll do it on winter.

mongoServer = "localhost"
mPort = 27017
mclient = MongoClient(mongoServer, mPort)
print "connected"
db = mclient.ilabmail
collection = db.xml

for i in final:
	collection.insert(i)
