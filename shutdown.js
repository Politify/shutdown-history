(function shutdownViz(){
    d3.selection.prototype.moveToFront = function() {
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
    };

    // data
    var data = window.shutdownData;

    // get number of days
    data.map(function(d){
        var numDays = new Date(d.endDate) - new Date(d.startDate);
        numDays = (numDays / 1000 / 60 / 60 / 24);
        d.numDays = numDays;
    });

    var $meta = $('#meta');
    var metaTemplate = $('#meta-template').html();
    var metaTemplateBase = $('#meta-template-base').html();
    $meta.html(_.template(metaTemplate, {
        data: data[data.length-1]}
    ));


    // ----------------------------------
    // Viz Helpers
    // ----------------------------------
    function itemMouseenter(d,i){ 
        // Update timeline viz
        var curDot = d3.select('.timeDot' + i);
        var curLine = d3.select('.timeLine' + i);
        var allDots = d3.selectAll('.timeDot');
        var allLines = d3.selectAll('.timeLine');

        // Update timeline viz
        var curBar = d3.selectAll('.shutdownBar' + i);
        var allBars = d3.selectAll('.shutdownBar');

        curLine.moveToFront();
        curDot.moveToFront();

        // Update dot and line active states
        allDots.classed('active', false);
        allDots.classed('inactive', true);
        curDot.classed('active', true);
        curDot.classed('inactive', false);

        allLines.classed('active', false);
        allLines.classed('inactive', true);
        curLine.classed('active', true);
        curLine.classed('inactive', false);

        // Updatedate shutdown viz
        allBars.classed('inactive', true);
        curBar.classed('inactive', false);

        // Update meta
        $meta.html(_.template(metaTemplate, {
            data: d   
        }));
        
    }
    function itemMouseleave(d,i){ 
        var allDots = d3.selectAll('.timeDot');
        var allLines = d3.selectAll('.timeLine');
        var allBars = d3.selectAll('.shutdownBar');

        // Update dot and line active states
        allDots.classed('active', false);
        allDots.classed('inactive', false);

        allLines.classed('active', false);
        allLines.classed('inactive', false);
        allBars.classed('inactive', false);

    }

    // ----------------------------------
    //
    // Timeline Visualization
    //
    // ----------------------------------
    function drawTimeline(){
        // Draws a timeline, interacts with shutdown length viz
        // setup scale
        var width = 1400;
        var height = 130;

        var margin = {top: 20, right: 20, bottom: 65, left: 30};
        var svg = d3.select('#time-viz').attr({ 
                height: height,
                width: width
            })
            .append('g')
                .attr({
                    transform: "translate(" + margin.left + "," + margin.top + ")"
                });

        var chartHeight = height - (margin.top + margin.bottom);
        var chartWidth = width - (margin.left + margin.right);
        var axesGroup = svg.append('g').attr({ 'class': 'axes' });
        var chart = svg.append('svg:g');

        // Setup scales
        // --------------------------------------
        var xScale = d3.scale.linear()
            .domain([
              new Date('11-02-1972'),
              new Date()
            ])
            .range([0, chartWidth]);

        var yScale = d3.scale.linear()
            .domain([d3.max(data, function(d,i){
                return d.numDays;
                }), 0
            ])
            .range([ 0, chartHeight - 8 ]);

        var dateRange = xScale.domain();
        var timeScale = d3.time.scale()
            .domain(dateRange)
            .range([0, chartWidth]);
        
        // Setup axes
        // --------------------------------------
        var xAxis = d3.svg.axis()
            .scale(timeScale)
            .tickSize(-chartHeight)
            .tickFormat(function(d,i){
                return d.getFullYear();
            })
            .tickValues([
                new Date('11-02-1972'),
                new Date('11-02-1976'),
                new Date('11-02-1980'),
                new Date('11-02-1984'),
                new Date('11-02-1988'),
                new Date('11-02-1992'),
                new Date('11-02-1996'),
                new Date('11-02-2000'),
                new Date('11-02-2004'),
                new Date('11-02-2008'),
                new Date('11-02-2012')
            ])
            .orient("bottom");

        var xAxisGroup = axesGroup.append("g")
            .attr({
                "class": "x axis",
                transform: "translate(0," + chartHeight + ")"
            })
            .call(xAxis);

        xAxisGroup.append('line')
            .attr({
                'class': 'baseline',
                x1: 0,
                x2: chartWidth,
                y1: 0,
                y2: 0 
            });
        
        // Setup chart
        // --------------------------------------

        // groups
        var bg = svg.append('svg:g');
        var axis = svg.append('svg:g');

        // LINES
        var timeBars = chart.selectAll('.timeLine')
            .data(data);

        // draw line for each item
        timeBars.enter().append('rect')
            .attr({
                'class': function(d,i){
                    var ret = 'timeLine timeLine' + i;
                    ret += ' ' + (d.presidentParty === 'democrat' ? 'dem' : 'rep');
                    return ret;
                },
                x: function(d,i){ return xScale(new Date(d.startDate) ); },
                width: function(d,i){
                    //return xScale(new Date(d.endDate)) - 
                        //xScale(new Date(d.startDate));
                    return 1;
                },
                y: function(d,i){
                    return yScale(d.numDays);
                },
                height: function(d,i){
                    return chartHeight - yScale(d.numDays);
                }
            })
            .on('mouseenter', itemMouseenter)
            .on('mouseleave', itemMouseleave);

        // draw dots on for each occurence
        var timeDots = chart.selectAll('.timeDot')
            .data(data);

        timeDots.enter().append('circle')
            .attr({
                'class': function(d,i){
                    var ret = 'timeDot timeDot' + i;
                    ret += ' ' + (d.presidentParty === 'democrat' ? 'dem' : 'rep');
                    return ret;
                },
                cx: function(d,i){ 
                    return xScale(new Date(d.startDate) ) + ((
                        xScale(new Date(d.endDate)) - 
                        xScale(new Date(d.startDate))
                    ) / 2); 
                },
                cy: chartHeight,
                r: 5
            })
            .on('mouseenter', itemMouseenter)
            .on('mouseleave', itemMouseleave);
    }

    // ----------------------------------
    //
    // Bars
    //
    // ----------------------------------
    function drawBars(){
        // Setup SVG 
        var width = 1000;
        var height = 330;

        var margin = {top: 20, right: 95, bottom: 65, left: 60};
        var svg = d3.select('#bar-viz').attr({ 
                height: height,
                width: width
            })
            .append('g')
                .attr({
                    transform: "translate(" + margin.left + "," + margin.top + ")"
                });

        // Setup chart
        var chartHeight = height - (margin.top + margin.bottom);
        var chartWidth = width - (margin.left + margin.right);
        var axesGroup = svg.append('g').attr({ 'class': 'axes' });
        var chart = svg.append('svg:g');

        // Draws bars for each shutdown
        
        // Setup scales
        // --------------------------------------
        var xScale = d3.scale.ordinal()
            .domain(data.map(function(d,i) { return i; }))
            .rangeRoundBands([0, chartWidth], 0.2);

        var yScale = d3.scale.linear()
            .domain([d3.max(data, function(d,i){
                return d.numDays;
                }), 0
            ])
            .range([0, chartHeight]);
        
        // Setup axes
        // --------------------------------------
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .ticks(data.length)
            .tickFormat(function(d,i){ 
                return ''; //data[i].president + ''; 
            })
            .tickSize(10)
            .orient("bottom");
        var xAxisGroup = axesGroup.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + chartHeight + ")")
            .call(xAxis);

        svg.selectAll('.x.axis text').attr({
            transform: 'translate(15 8) rotate(25)'
        });

        // y axis
        var yAxis = d3.svg.axis()
            .scale(yScale)
            .tickSize(-chartWidth)
            .tickFormat(function(d,i){ 
                return d;
            })
            .orient("left");

        var yAxisGroup = axesGroup.append("g")
            .attr("class", "y axis");

        yAxisGroup.call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        // Setup bars
        // --------------------------------------
        var barWidth = xScale.rangeBand();
        var barX = function(d,i){ return xScale(i); };

        var bars = chart.selectAll('.presBar')
            .data(data);

        bars.enter().append('svg:rect')
            .attr({ 
                height: 0,
                x: barX,
                y: chartHeight,
                width: barWidth
            })
            .on('mouseenter', itemMouseenter)
            .on('mouseleave', itemMouseleave);

        bars.transition()
            .attr({
                'class': function(d,i){
                    var ret = 'presBar shutdownBar shutdownBar' + i;
                    if(i === data.length - 1){ ret += ' lastItem'; }
                    ret += ' ' + (d.presidentParty === 'democrat' ? 'dem' : 'rep');
                    return ret;
                },
                y: function(d,i){ 
                    return yScale(d.numDays);
                },
                height: function(d,i){ 
                    return chartHeight - yScale(d.numDays);
                }
            });

        // Senate / house bars
        // ------------------------------
        var senateBars = chart.selectAll('.senateBar')
            .data(data);
        senateBars.enter().append('rect')
            .attr({
                'class': function(d,i){
                    var ret = 'senateBar shutdownBar senateBar' + i + ' shutdownBar' + i;
                    ret += ' ' + (d.senate === 'democrat' ? 'dem' : 'rep');
                    return ret;
                },
                x: barX,
                width: barWidth / 2,
                y: chartHeight + 8,
                height: 26
            })
            .on('mouseenter', itemMouseenter)
            .on('mouseleave', itemMouseleave);

        var houseBars = chart.selectAll('.houseBar')
            .data(data);
        houseBars.enter().append('rect')
            .attr({
                'class': function(d,i){
                    var ret = 'houseBar shutdownBar houseBar' + i + ' shutdownBar' + i;
                    ret += ' ' + (d.house === 'democrat' ? 'dem' : 'rep');
                    return ret;
                },
                x: function(d,i){
                    return barX(d,i) + (barWidth / 2);
                },
                width: barWidth / 2,
                y: chartHeight + 8,
                height: 26
            })
            .on('mouseenter', itemMouseenter)
            .on('mouseleave', itemMouseleave);


        // Chart Labels
        // ------------------------------
        chart.append('text')
            .attr({
                'class': 'axisLabel',
                y: chartHeight + margin.bottom - 5,
                x: (chartWidth / 2) - 50
            })
            .text('President');

        chart.append('text')
            .attr({
                'class': 'axisLabel',
                transform: 'translate(' + [
                    -35, (chartHeight + margin.bottom + margin.top) / 2] + ') rotate(270)'
            })
            .text('Days Shutdown');

        // Draw average line
        var average = d3.mean(data, function(d){ return d.numDays; });
        chart.append('line')
            .attr({
                'class': 'averageLine',
                x1: 0,
                x2: chartWidth,
                y1: yScale(average),
                y2: yScale(average)
            });
        chart.append('text')
            .attr({
                'class': 'averageText',
                y: yScale(average),
                x: chartWidth + 4
            }).text('Average: ' + (Math.round(average * 10) / 10) + ' days');
    }

    drawBars();
    drawTimeline();

})();
