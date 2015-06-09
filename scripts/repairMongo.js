mongo = require('mongojs');

var dbUrl = "localhost:27017/ilabmail"
	collections = ["raw"]
	db = mongo.connect(dbUrl, collections)

console.log('Repairing broken dates...')

db.raw.find({"Time":"+1000 +1000"},function (err, result) {
	result.forEach( function (i){

		// Fix Time
		var d = new Date(i['Date'])
		var t = d.toTimeString().split(' ').slice(0,2)
		i["Time"] = t[0] + " +1000"
		
		// Fix Date now
		d = d.toDateString().split(' ')
		t = d[2]+' '+d[1]+' '+d[3]
		i["Date"] = t

		// Show us
		console.log(i);
		db.raw.save(i) // and save
	});
console.log('Repaired broken dates, now repairing broken setup titles...')
})


db.raw.find({SetupId:{$exists:1}}, function (err, result) {
	result.forEach(function (d){
		d["Setup"] = d["SetupId"]
		delete d.SetupId
		
		// Fixed!
		console.log(d)
		db.raw.save(d)
	})
console.log('Repaired broken setup titles, now repairing MachinesLab Broker discrepancies...')
})


db.raw.find({ServiceBroker:"MachinesLab"}, function (err, result) {
	result.forEach(function (d) {
		d["ServiceBroker"] = "UQ MachinesLab"
		db.raw.save(d) // save it back in
	})
console.log('Repaired MachinesLab discrepancies')
})


console.log('Repairing old Day, date month year style Dates')
db.raw.find(function (err, result) {
	result.forEach(function (d) {
		t = d["Date"].split(' ')
		if (t.length > 3) {
			d['Date'] = t.slice(1,4).join(' ')
			db.raw.save(d)
		}
		// console.log(d.Date)

	})
	console.log('finished repairing old dates')
})

console.log('Retro-actively applying UID to entries with out them')
db.raw.find({uid:{$exists:0}}, function (err, result) {
	result.forEach(function (d) {
		UID = d["Setup"].slice(0,3) +
        d["LabServer"].slice(0,3) +
        d["ServiceBroker"].slice(0,3).trim() +
        d["ServiceBroker"].slice(-3) +
        d["Usergroup"].slice(0,3) +
        d["Experiment Id"]
    	
    	console.log('UID == ' + UID)	
		d["uid"] = UID
    	db.raw.save(d)
    })
    console.log('Finished applying new Created UIDs')
})