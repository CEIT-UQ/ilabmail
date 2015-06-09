# Dumps the raw information collected via ilabs to data.csv
# If the local node.js server is running then this is accessible online at winter.ceit.uq.edu.au:port/data.csv
mongoexport --csv -d ilabmail -c raw -o public/data.csv -f Setup,Time,Date,ServiceBroker,Usergroup,StatusCode
