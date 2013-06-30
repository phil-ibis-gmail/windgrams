
var windgramCanvasWidth = 800;
var windgramCanvasHeight= 800;
var windgramMinElevation=0; // ft.
var windgramMaxElevation=10000; //ft.
var windgramCanvasId="";
var windgramCanvasType="";

function xcoord(input)
{
    input = input + 1; // shift everything over by an hour.
    var tx = (input - 0)/(25-0);
    return tx*windgramCanvasWidth;
}

function ycoord(input)
{
    var t1 = (input-windgramMinElevation);
    var t2 = (windgramMaxElevation-windgramMinElevation);
    var ty = 1.0 - (t1/t2);
    return ty * windgramCanvasHeight;
}

function invert_xcoord(input)
{
    return ((input/windgramCanvasWidth)*25)-1;
}

function invert_ycoord(input)
{
    return ((1.0-(input/windgramCanvasHeight))*(windgramMaxElevation-windgramMinElevation))+windgramMinElevation;
}

function rectangle(context,x1,y1,x2,y2)
{
    context.fillRect(x1,y1,x2-x1,y2-y1);
}

// Read a page's GET URL variables and return them as an associative array.
function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

//////////////////////////////////////////////////////////////////////////////////

function lapse_color(rate)
{
    if(rate >= 3.5) return "#FF0000"; // red!
    if(rate >= 3.0) return "#FF1A2F"; // red
    if(rate >= 2.75)return "#FF5A20"; //?
    if(rate >= 2.5) return "#FF7A1F"; // orange
    if(rate >= 2.0) return "#EFBD25"; // yellow
    if(rate >= 1.5) return "#FFFFC4"; // almost white
    if(rate >= 1.0) return "#ADB7CF"; // blue
    if(rate >= 0.0) return "#D7D7D7"; // grey
    if(rate < 0) return "#B0B0B0";
    
/*    var color="#FFFFFF";
    if(rate>3.1) color="#800080"; // purple
    else if(rate>2.8) color="#FF0000"; // red
    else if(rate>2.2) color="#FFA500"; // orange
    else if(rate>1.8) color="#FFFF00"; // yellow
    else if(rate<0.5) color="#808080"; // grey
    else if(rate<1.4) color="#ADD8E6"; // light blue
    return color;*/
}

function lapse_rate(context,x0,x1,y0,y1,rate1,rate2)
{
    var color1 = lapse_color(rate1);
    var color2 = lapse_color(rate2);
    var ya=(y1+y0)/2; var h2=ya-y0;
    var gradient = context.createLinearGradient(0,ya,0,y1);
    gradient.addColorStop(0,color1);
    gradient.addColorStop(1,color2);
    context.fillStyle = color1;    
    context.fillRect(x0,y0,x1-x0,h2-1); // -1 to make the rectangles "overlap" a bit.
    context.fillStyle = gradient;
    context.fillRect(x0,ya,x1-x0,h2-1); // -1 to make the rectangles "overlap" a bit.
}

function windbarb(context,x,y,speed,direction)
{
    if(speed < 2)
    {
        // zero speed -- draw circle.
        context.beginPath();
        context.arc(x,y,3,0,6.28,false);
        context.strokeStyle = "#000";
        context.lineWidth = 2;
        context.stroke();
        return;
    }
    
    var rx = Math.sin((Math.PI * direction)/180.0);
    var ry = -Math.cos((Math.PI * direction)/180.0);
    
    var r = 25;
    var fx = r*rx;
    var fy = r*ry;
    
    context.beginPath();
    context.moveTo(x+fx,y+fy);
    context.lineTo(x,y);

    var sx = -ry; var sy = rx; // perpendicular to barb, and "above" (probably should be more like 110deg)
    var barb_pixels_max = 12; // 10 knots is 12 pixels.
    var ispeed = speed;
    for (var pct = 1.0; pct >= 0.20; pct -= 0.18) // draw the speed "back" along the spine
    {
        if(ispeed < 50)
        {
            var barb_speed = ispeed < 10 ? ispeed : 10; // length of barb (0-10kts)
            var rb = barb_pixels_max * (barb_speed) / 10.0; // i.e 10kt is barb_pixels_max
            var bxs = (r * pct * rx); var bys = (r * pct * ry);
            var bxe = (rb * sx); var bye = (rb * sy); // end of barb.
            context.moveTo(x+bxs,y+bys);
            context.lineTo(x + bxs + bxe, y + bys + bye);
            ispeed -= barb_speed;
        }
        else
        {
            // greater than 50Kt winds!
            pct -= 0.05;
            var barb_speed = 50;
            var bxs0 = (r * (pct - 0.0) * rx); var bys0 = (r * (pct - 0.0) * ry);
            var bxs1 = (r * (pct-0.1) * rx); var bys1 = (r * (pct-0.1) * ry);
            var bxs2 = (r * (pct+0.1) * rx); var bys2 = (r * (pct+0.1) * ry);
            var rb = barb_pixels_max * (barb_speed) / 50.0; // i.e 50kt is barb_pixels_max
            var bxe = (rb*sx); var bye = (rb*sy); // end of barb.
            context.moveTo(x + bxs1, y + bys1);
            context.lineTo(x + bxs0 + bxe,y + bys0 + bye);
            context.lineTo(x + bxs2,y + bys2);
            context.lineTo(x + bxs1, y + bys1);
            /*Point[] points = {
                new Point(x + bxs1, y + bys1),
                new Point(x + bxs0 + bxe,y + bys0 + bye),
                new Point(x + bxs2,y + bys2),
                new Point(x + bxs1, y + bys1),
            };
            gbmp.FillPolygon(brush, points);*/
            ispeed -= barb_speed;
            pct -= 0.04;
    
        }
        
        // check if we've drawn all our speed.
        if (ispeed == 0)
            break;
    }
    context.strokeStyle = "#000";
    context.lineWidth = 2;
    context.fillStyle = "#000"; // haha, some of the lines make polys and some don't, but fill figures it out!
    context.fill();
    context.stroke();
}

function windgram_slice_setData(lines)
{
    this.numLines=lines.length;
    this.elevations = new Array(lines.length);
    this.directions = new Array(lines.length);
    this.speeds = new Array(lines.length);
    this.temps = new Array(lines.length);
    this.maxTemp = -100;
    this.minTemp = 100;
    
    for(var i=0;i<this.numLines;i++)
    {
        var reg=/\s+/;
        var numbres = lines[i].firstChild.nodeValue.split(reg);
        this.elevations[i] = numbres[0];
        this.directions[i] = numbres[3];
        this.speeds[i] = parseFloat(numbres[4]);
        this.temps[i] = parseFloat(numbres[6]);
        if(this.temps[i] > this.maxTemp)
            this.maxTemp = this.temps[i];
        if(this.temps[i] < this.minTemp)
            this.minTemp = this.temps[i];
     }
     this.dataIsReady=true;
}

function windgram_slice_draw_lapse_rate(windgram_context)
{
     for(var i=1;i<this.numLines;i++)
     {
        var lapse1 = (this.temps[i]-this.temps[i-1])/(this.elevations[i]-this.elevations[i-1]);
        
        var lapse2 = lapse1;
        if(i<this.numLines-1)
            lapse2 = (this.temps[i+1]-this.temps[i])/(this.elevations[i+1]-this.elevations[i]);
            
        lapse2 = -lapse2*1000.0;
        lapse1 = -lapse1*1000.0;
        lapse_rate(windgram_context,xcoord(this.hour),xcoord(this.hour+1),ycoord(this.elevations[i-1]),ycoord(this.elevations[i]),lapse1,lapse2);
     }
}

function windgram_slice_draw_wind_barbs(windgram_context)
{
     for(i=0;i<this.numLines;i++)
     {
        windbarb(windgram_context,xcoord(this.hour+0.5),ycoord(this.elevations[i]),this.speeds[i],this.directions[i]);
     }
}

function windgram_slice_getElevationAtTemperature(temperature)
{
    var maxtemp = -200;
    var mintemp = 200;

    for(var i=1;i<this.numLines;i++)
    {
        var temp0 = this.temps[i-1];
        var temp1 = this.temps[i];

        if(temp0 > maxtemp) maxtemp = temp0;
        if(temp0 < mintemp) mintemp = temp0;
        
        if(temp0 >= temperature && temp1 < temperature)
        {
            var elev0 = parseFloat(this.elevations[i-1]);
            var elev1 = parseFloat(this.elevations[i]);
            var fraction = (temp0-temperature)/(temp0-temp1);
            var returnval = (elev0 + fraction*(elev1-elev0));
            return returnval;
        }
    }
    // if it's out of range then return max/min elevation where appropriate
    if(temperature > maxtemp) return parseFloat(this.elevations[0]);
    if(temperature < mintemp) return parseFloat(this.elevations[this.numLines-1]);
}

function windgram_slice_lookupParameters(elevation)
{
     var params = new Array;
     for(i=0;i<this.numLines-1;i++)
     {
        if(this.elevations[i]<elevation && this.elevations[i+1]>elevation)
        {
            var fraction = (elevation-this.elevations[i])/(this.elevations[i+1]-this.elevations[i]);
            params.hour = this.hour;
            params.elevation=elevation/3.28;
            params.windSpeed = ((this.speeds[i+1]-this.speeds[i])*fraction+this.speeds[i]); // speed is interpolated
            params.temperature = ((this.temps[i+1]-this.temps[i])*fraction+this.temps[i]); // temps is interpolated
            params.windDirection= parseFloat(this.directions[i]);
            params.lapseRate = (this.temps[i+1]-this.temps[i])/(this.elevations[i+1]-this.elevations[i])*1000.0;
            params.index = i;
            return params;
        }
     }
}

function windgram_slice_highlightCell(context,index)
{
    var x0 = xcoord(this.hour); var x1 = xcoord(this.hour+1);
    var y0 = ycoord(this.elevations[index]); var y1 = ycoord(this.elevations[index+1]);
    
    context.beginPath();
    context.moveTo(x0,y0);
    context.lineTo(x1,y0);
    context.lineTo(x1,y1);
    context.lineTo(x0,y1);
    context.lineTo(x0,y0);
    
    context.strokeStyle = "#000";
    context.lineWidth = 2;
    context.stroke();
}

function windgram_slice_unhighlightCell(context, index)
{
}

function WindgramSlice(hour)
{
    this.hour=hour;
    this.xmlHttpReq = new XMLHttpRequest;
    this.dataIsReady=false;
}

WindgramSlice.prototype.xmlHttpReq;
WindgramSlice.prototype.setData = windgram_slice_setData;
WindgramSlice.prototype.drawLapseRate = windgram_slice_draw_lapse_rate;
WindgramSlice.prototype.drawWindBarbs = windgram_slice_draw_wind_barbs;
WindgramSlice.prototype.getElevationAtTemperature = windgram_slice_getElevationAtTemperature;
WindgramSlice.prototype.lookupParameters = windgram_slice_lookupParameters;
WindgramSlice.prototype.highlightCell = windgram_slice_highlightCell;
WindgramSlice.prototype.unhighlightCell = windgram_slice_unhighlightCell;
WindgramSlice.prototype.elevations;
WindgramSlice.prototype.directions;
WindgramSlice.prototype.speeds;
WindgramSlice.prototype.temps;
WindgramSlice.prototype.numLines=0;
WindgramSlice.prototype.hour=0;
WindgramSlice.prototype.dataIsReady;
WindgramSlice.prototype.maxTemp;
WindgramSlice.prototype.minTemp;


////////////////////////////////

function windgram_setData(xmlDoc)
{
    var error = xmlDoc.getElementsByTagName("error");
    if(error.length == 0) // i.e no errors
    {
        var query = xmlDoc.getElementsByTagName("query");
        var query_reg=/\s+/;
        var queries = query[0].firstChild.nodeValue.split(query_reg);
        var lng = parseFloat(queries[0]);
        var lat = parseFloat(queries[1]);
        var hour = parseInt(queries[2]);
                
        var lines = xmlDoc.getElementsByTagName("line");
        this.Slices[hour].setData(lines);
    }
    // if there is an error returned, then the data is never isDataReady is never set for that slice.
}

function windgram_draw_lapse_rate(windgram_context,hour)
{
    this.Slices[hour].drawLapseRate(windgram_context);
}

function windgram_draw_barbs(windgram_context,hour)
{
    this.Slices[hour].drawWindBarbs(windgram_context);
}

function windgram_drawElevations(windgram_context)
{
    windgram_context.save();
    // horizontal lines for elevation
    windgram_context.beginPath();
    var px0 = xcoord(0);
    var px1 = xcoord(24);
    var text_x = xcoord(22);
    
    windgram_context.textBaseline = "middle";
    windgram_context.font = "sans-serif";
    windgram_context.fillStyle = "#000000";
    var min_meters = windgramMinElevation/3.28;
    var max_meters = windgramMaxElevation/3.28;
    for (var i = min_meters; i < max_meters; i += 250.0)
    {
        var py = ycoord(i*3.28);
        windgram_context.moveTo(px0,py);
        windgram_context.lineTo(px1,py);
        windgram_context.fillText(i,text_x,py);
    }


    var currentTime = new Date()
    windgram_context.textAlign = "center";
    for(var i=0;i<18;i++)
    {
        var px = xcoord(i);
        var py0 = ycoord(windgramMinElevation);
        var py1 = ycoord(windgramMaxElevation);
        var text_y = ycoord((min_meters+200)*3.28);
        windgram_context.moveTo(px,py0);
        windgram_context.lineTo(px,py1);
        windgram_context.fillText((i+currentTime.getHours())%24,px,text_y);
    }

    windgram_context.textAlign = "left";
    windgram_context.fillText("generated: "+currentTime,xcoord(0),ycoord((min_meters+125)*3.28));

    
    windgram_context.strokeStyle = "#DDDDDD";
    windgram_context.lineWidth = 1;
    windgram_context.stroke();
    windgram_context.closePath();
    
    var yinterest = ycoord(this.elevationOfInterest*3.28);
    windgram_context.beginPath();
    windgram_context.moveTo(px0,yinterest);
    windgram_context.lineTo(px1,yinterest);
    windgram_context.strokeStyle = "#800000";
    windgram_context.fillText(this.elevationOfInterest,text_x,yinterest);
    windgram_context.stroke();
    windgram_context.closePath();
    windgram_context.restore();
}

function windgram_isTemperatureAttained(temperature)
{
    for(var t=0;t<18;t++)
    {
        if(temperature >= this.Slices[t].minTemp && temperature <= this.Slices[t].maxTemp)
            return true;
    }
    return false;
}

function windgram_getNextHourWithData(hour)
{
    for(var t=hour+1;t<18;t++)
    {
        if(this.Slices[t].dataIsReady)
            return t;
    }
    return 18;
}

function windgram_drawTemperatureLine(windgram_context, temperature)
{
    windgram_context.save();
    windgram_context.beginPath();
    for(var hour=0;hour<18;hour++)
    {
        if(this.Slices[hour].dataIsReady)
        {
            var next_hour = this.getNextHourWithData(hour);
            var elevation0 = this.Slices[hour].getElevationAtTemperature(temperature);
            var elevation1 = elevation0;
            if(next_hour < 18)
                elevation1 = this.Slices[next_hour].getElevationAtTemperature(temperature);
            var ey0 = ycoord(elevation0);
            var ey1 = ycoord(elevation1);
            var px0 = xcoord(hour+0.5);
            var px1 = xcoord(next_hour+0.5);

            windgram_context.moveTo(px0,ey0);
            windgram_context.lineTo(px1,ey1);
            
            if(next_hour == 18)
            {
                var xnew=px1+60;
                windgram_context.lineTo(xnew,ey1);
                windgram_context.textBaseline = "middle";
                windgram_context.font = "sans-serif";
                windgram_context.fillStyle = "#000000";
                windgram_context.fillText(temperature+"°C",xnew+4,ey1);
                break; // no more need to test more hours.
            }
        }
    }
    if(temperature <= 0)
        windgram_context.strokeStyle = "#A00000";
    else
        windgram_context.strokeStyle = "#707070";
    windgram_context.lineWidth = 2;
    windgram_context.stroke();
    
    windgram_context.closePath();
    windgram_context.restore();
}

function windgram_lookupParameters(hour,elevation)
{
    if(this.Slices[Math.floor(hour)] != null)
        return this.Slices[Math.floor(hour)].lookupParameters(elevation);
    else
        return null
}

function windgram_highlightCell(hour,index)
{
    return this.Slices[Math.floor(hour)].highlightCell(this.context,index);
}

function windgram_unhighlightCell(hour,index)
{
    return this.Slices[Math.floor(hour)].unhighlightCell(this.context,index);
}


function windgram_redraw(windgram_context,windgram_canvas)
{
    // clears the canvas
    windgram_canvas.width = windgram_canvas.width;
    
    for(var hour=0;hour<18;hour++)
    {
        this.drawLapseRate(windgram_context,hour);
    }
    
    if(windgramCanvasType == "large")
    {
        for(var temp=-10.0;temp<=40.0;temp+=5.0)
        {
            if(this.isTemperatureAttained(temp))
            {
                this.drawTemperatureLine(windgram_context,temp);
            }
        }
      
        this.drawElevations(windgram_context);
        
        for(var hour=0;hour<18;hour++)
        {
            this.drawWindBarbs(windgram_context,hour);
        }

        // draw a lapse rate legend
        windgram_context.save();
        windgram_context.textBaseline = "middle";
        windgram_context.font = "sans-serif";

        var min_meters = windgramMinElevation/3.28;

        windgram_context.fillText("lapse rate °C/1000ft", xcoord(19.4),ycoord((min_meters+155)*3.28));
        
        for(var i=-0.5;i<4.0;i+=0.5)
        {
            windgram_context.fillStyle = lapse_color(i);
            var xpos = xcoord(16.4)+i*60;
            var ypos = ycoord((min_meters+125)*3.28);
            windgram_context.fillRect(xpos,ypos,30,30);
            windgram_context.fillStyle = "#000000";
            windgram_context.fillText(i,xpos+5,ypos+15);    
        }
        windgram_context.restore();
    }
}

function is_all_data_ready()
{
    for(var hour=0;hour<18;hour++)
    {
        if(this.Slices[hour].dataIsReady == false)
            return false;
    }
    return true;
}

function Windgram()
{
    for(var hour=0;hour<18;hour++)
    {
        this.Slices[hour] = new WindgramSlice(hour);
    }
}

Windgram.prototype.setData = windgram_setData;
Windgram.prototype.drawLapseRate = windgram_draw_lapse_rate;
Windgram.prototype.drawWindBarbs = windgram_draw_barbs;
Windgram.prototype.drawElevations = windgram_drawElevations;
Windgram.prototype.isTemperatureAttained = windgram_isTemperatureAttained;
Windgram.prototype.drawTemperatureLine = windgram_drawTemperatureLine
Windgram.prototype.getNextHourWithData = windgram_getNextHourWithData;
Windgram.prototype.lookupParameters = windgram_lookupParameters;
Windgram.prototype.highlightCell = windgram_highlightCell;
Windgram.prototype.unhighlightCell = windgram_unhighlightCell;

Windgram.prototype.redraw = windgram_redraw;
Windgram.prototype.isAllDataReady = is_all_data_ready;
Windgram.prototype.Slices = new Array(18);
Windgram.prototype.elevationOfInterest;
Windgram.prototype.context;

/////////////////////////////////

var TheWindgram = new Windgram();

// wrong sometimes: http://127.0.0.1/scraper.php?lng=-119.0009&lat=49.1913&elevation=900&hour=17
// because the op40 website supplies no data for that hour: http://www-frd.fsl.noaa.gov/mab/soundings/reply-skewt.cgi?data_source=Op40&lon=-120.03640000000001&lat=49.3508&airport=%28none%29&add_hours=17
function xmlreadystatecallback()
{
    if (this.readyState==4)
    {
        var xmlDoc = this.responseXML;
        if(xmlDoc != null)
        {
            var windgram_canvas = document.getElementById(windgramCanvasId);
            var windgram_context = windgram_canvas.getContext("2d");

            if(this.status == 200)
            {
                // set the data for the slice we just got back an answer for.
                TheWindgram.setData(xmlDoc);

                // redraw the entire windgram. That way everything that should be sorted in front of everything will be.
                TheWindgram.redraw(windgram_context,windgram_canvas);
            }
            else
            {
                document.write("it's not 200 again\n"+this.status+"<br/>");
                var hellowworld = document.getElementById("helloworld");
                helloworld.innerText = this.responseText;
            }
        }
        else
        {
            //document.write("it's null again\n"+this.responseText+"<br/>");
            var hellowworld = document.getElementById("helloworld");
            helloworld.innerText = this.responseText;
        }
    }
}

function draw_windgram(canvas_id,placename,lat,lng,launch_elevation,base_elevation,type) 
{
    TheWindgram.elevationOfInterest = launch_elevation;
    TheWindgram.baseElevation = base_elevation;
    windgramMinElevation=base_elevation*3.28; // ft.
    windgramMaxElevation=(windgramMinElevation+3000*3.28);

    var windgram_canvas = document.getElementById(canvas_id);
    var windgram_context = windgram_canvas.getContext("2d");
    TheWindgram.context = windgram_context;
    
    windgramCanvasWidth = windgram_canvas.width;
    windgramCanvasHeight= windgram_canvas.height;
    windgramCanvasId = canvas_id;
    windgramCanvasType = type;
    
    
    windgram_canvas.addEventListener("click", windgram_click, false);
    windgram_canvas.addEventListener("mouseover",windgram_mouseover,false);
    windgram_canvas.addEventListener("mousemove",windgram_mousemove,false);
    windgram_canvas.addEventListener("mouseout",windgram_mouseout,false);

    for(var hour=0;hour<18;hour++)
    {
        var url = "scraper.php?lng="+lng+"&lat="+lat+"&hour="+hour+"&placename="+placename;
        
        var xmlhttp = TheWindgram.Slices[hour].xmlHttpReq;
        if(xmlhttp.overrideMimeType)
            xmlhttp.overrideMimeType('text/xml');
        xmlhttp.open("GET", url, true);
        xmlhttp.send(null);
      
        xmlhttp.onreadystatechange = xmlreadystatecallback;
    }
}

function mini_windgram(placename,lat,lng,launch_elevation,base_elevation)
{
    draw_windgram('mini',placename,lat,lng,launch_elevation,base_elevation,'tiny');
}

function getCursorPosition(e) {
    var windgram_canvas = document.getElementById(windgramCanvasId);
    
    
    var x;
    var y;
    if (e.pageX != undefined && e.pageY != undefined) {
	x = e.pageX;
	y = e.pageY;
    }
    else {
	x = e.clientX + document.body.scrollLeft +
            document.documentElement.scrollLeft;
	y = e.clientY + document.body.scrollTop +
            document.documentElement.scrollTop;
    }
    x -= windgram_canvas.offsetLeft;
    y -= windgram_canvas.offsetTop;
    
    
    var params = TheWindgram.lookupParameters(invert_xcoord(x),invert_ycoord(y));
    if(params != null)
    {
    params.elevation      = Math.floor(params.elevation);
    params.hour           = Math.floor(params.hour);
    params.lapseRate      = Math.round(params.lapseRate*10)/10;
    params.windSpeed      = Math.floor(params.windSpeed);
    params.windDirection  = Math.floor(params.windDirection);
    params.temperature    = Math.floor(params.temperature);
    }
    return params;
    
    }

var last_hour=null;
var last_index=null;

function windgram_click(e)
{
    var data = getCursorPosition(e);

    if(data != null)
    {
        var infoz = /*data.hour+"h  "+*/data.windSpeed+"kt "+data.windDirection+"° "+data.elevation+"m "+data.lapseRate+"°C/1000ft "+data.temperature+"°C";

//        if(last_hour != null && last_index != null)
  //          TheWindgram.unhighlightCell(last_hour,last_index);
    //    TheWindgram.highlightCell(data.hour,data.index);
        last_hour=data.hour;
        last_index = data.index;
        tooltip.show(infoz);
        tooltip.pos(e);
    }   
}

function windgram_mouseout(e)
{
    tooltip.hide();
}

function windgram_mouseover(e)
{
    var data = getCursorPosition(e);

    if(data != null)
    {
       var infoz = /*data.hour+"h  "+*/data.windSpeed+"kt "+data.windDirection+"° "+data.elevation+"m "+data.lapseRate+"°C/1000ft"+data.temperature+"°C";
        tooltip.show(infoz);    
        tooltip.pos(e);
    }
}

function windgram_mousemove(e)
{
    var data = getCursorPosition(e);

    if(data != null)
    {
        var infoz = /*data.hour+"h  "+*/data.windSpeed+"kt "+data.windDirection+"° "+data.elevation+"m "+data.temperature+"°C "+data.lapseRate+"°C/1000ft";

        tooltip.show(infoz);    
        tooltip.pos(e);
    }
}


