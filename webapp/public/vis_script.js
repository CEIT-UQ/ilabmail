// csv format for help:
// Setup,Time,Date,ServiceBroker,LabServer,StatusCode
// "RadioactivityVsTime","20:04:27 +1000","Thu, 12 Mar 2015","Carinthia","Radioactivity","Completed"

// Let's use our actual data now.
d3.csv('data.csv', function (data) {

// Setup formats of date & time
var parseDate = d3.time.format('%e %b %Y').parse
	dateFormat = d3.time.format('%d/%m/%Y');
	parseTime = d3.time.format('%X %Z').parse
	prettyTime = d3.time.format('%I %p')
	prettyFullTime = d3.time.format('%I:%M %p')


// Convert strDate to a Date object
data.forEach(function (d) {
	d.date = new Date(d.Date)
	d.time = parseTime(d.Time)
})

var ndx = crossfilter(data) // Make the Crossfilter
var all = ndx.groupAll();

// These are out graphs and we tie them to div classes
dFreq = dc.barChart('#experimental-freq-chart')
zoomChart = dc.barChart('#zoom-data-chart')
brokerSplit = dc.pieChart('#serviceBroker-dist-chart')
failureRate = dc.pieChart('#failure-dist-chart')
dayDist = dc.barChart('#time-dist-chart')
setupSplit = dc.rowChart('#setup-split')
mostRecent = dc.dataTable('#most-recent-chart')

/*///////////////////////////////////////////////////
		
		These are our dimensions and groups
*/

// Order by date
dateDim = ndx.dimension(function (d) {
	return +d.date
})

// Max and min dates are helpful for scales
minDate = dateDim.bottom(1)[0].date
maxDate = dateDim.top(1)[0].date

// All the experiments that failed in a group
failureBarGroup = dateDim.group().reduceSum(function (d) {
	if (d.StatusCode == "Failed") {
		return 1
	}
	return 0
})

// All the experiments that passed in a group
successBarGroup = dateDim.group().reduceSum(function (d) {
	if (d.StatusCode == "Completed") {
		return 1
	}
	return 0
})

// Order with ServiceBroker
brokerDim = ndx.dimension(function (d) {
	return d.ServiceBroker
})

// Order with StatusCode
failureDim = ndx.dimension(function (d) {
	return d.StatusCode
})

// Order by hour of day
timeDim = ndx.dimension(function (d) {
	return d.time.getHours()
})

// clump this dist by hour
hourGroup = timeDim.group().reduceSum(function (d) {})

// Order by setup
setupDim = ndx.dimension(function (d) {
	return d.Setup
})


/*///////////////////////////////////////////////
		
		Here we format the graphs
*/

dFreq
	.height(300)
	.width(1002)
	.margins({top: 0, right: 50, bottom: 20, left: 40})
	.dimension(dateDim)
	.group(successBarGroup, 'Successful Experiments')
	.stack(failureBarGroup, 'Failed Experiments')
	.x(d3.time.scale().domain([minDate, maxDate]))
	.yAxisLabel("Number of Experiments")
	.xUnits(d3.time.days)
	.renderHorizontalGridLines(true)
	.elasticY(true)
	.yAxisPadding('5%')
	.mouseZoomable(true)
	.centerBar(true)
	.rangeChart(zoomChart)
	.brushOn(false)
	.legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
	.title(function (d) {
		return 'Date: ' + dateFormat(new Date(d.key)) + '\nNumber of Experiments: ' + d.value
	})


zoomChart
	.height(40)
	.width(990)
	.margins({top: 0, right: 50, bottom: 20, left: 40})
	.dimension(dateDim)
	.group(dateDim.group())
	.centerBar(true)
	.x(d3.time.scale().domain([new Date(+minDate-604800000), new Date(+maxDate+604800000)]))
	.y(d3.scale.linear().domain([0, 600]))
	.elasticY(true)
	// .y(d3.scale.log().range([0, 800]))
	.round(d3.time.week.round)
	.alwaysUseRounding(true)
	.xUnits(d3.time.weeks)
	.turnOnControls(true)


dc.dataCount('.dc-data-count')
    .dimension(ndx)
    .group(all)
    .html({
        some:'<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
            ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'\'>Reset All</a>',
        all:'All %total-count records selected. Please click on the graph to apply filters.'
    });


brokerSplit
	.height(220)
	.width(245)
	.dimension(brokerDim)
	.group(brokerDim.group())
	.renderLabel(true)
	.turnOnControls(true)


failureRate
	.height(220)
  	.width(245)
	.dimension(failureDim)
	.group(failureDim.group())
  	.renderLabel(true)
  	.label(function (d) {
        if (failureRate.hasFilter() && !failureRate.hasFilter(d.key)) {
            return d.key + ' (0%)';
        }
        var label = d.key;
        if (all.value()) {
            label += ' (' + Math.floor(d.value / all.value() * 100) + ' %)';
        }
        return label;
    })
    .turnOnControls(true)


dayDist
	.height(220)
	.width(245)
	.margins({top: 0, right: 50, bottom: 40, left: 40})
	.dimension(timeDim)
	.group(timeDim.group())
	// .brushOn(false)
	.x(d3.scale.linear().domain([0, 24]))
	.elasticY(true)
	.yAxisPadding('5%')
	.turnOnControls(true)
	.yAxisLabel('Number of Experiments')
	.xAxis().ticks(8)

dayDist.xAxis().tickFormat(function (d) {
	var t = prettyTime(new Date(0,0,0,d))
	return t.charAt(0)=='0'?t.substring(1):t
})

setupSplit
	.width(280)
	.height(220)
	.dimension(setupDim)
	.group(setupDim.group())
	.elasticX(true)
	.ordering(function(d) { return -d.value })
	.rowsCap(6)
	.xAxis().ticks(4)

mostRecent
	.width(990)
	.height(800)
	.dimension(dateDim)
	.group(function (d) { return ''})
	.size(30)
	.columns([
		function (d) { return d.Setup }
	,	function (d) { return d.Usergroup }
	,	function (d) { return d.ServiceBroker }
	,	function (d) { return d.Date.charAt(0)=='0'?d.Date.substring(1):d.Date }
	,	function (d) { var i=prettyFullTime(new Date(d.time)); return i.charAt(0)=='0'?i.substring(1):i }
	,	function (d) { return d.StatusCode }
	])
	.sortBy(function (d) {return +d.date + +d.time})
	.order(d3.descending)



// Render all the graphs!
dc.renderAll();

}) // close the csv callback