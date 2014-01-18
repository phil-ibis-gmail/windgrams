<!DOCTYPE html >
<html>
<head>
    <title>windgram</title>
    <script type="text/javascript">

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-27362040-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

</script>
</head>
<style type="text/css">
  html { height: 100% }
  body { height: 100%; margin: 0; padding: 0; font-family: sans-serif}
  
  #tt {
 position:absolute;
 display:block;
 border-radius: 5px;
 /*background:url(images/tt_left.gif) top left no-repeat;*/
 }
 #tttop {
 display:block;
 height:5px;
 margin-left:5px;
 /*background:url(images/tt_top.gif) top right no-repeat;*/
 overflow:hidden;
 border-radius: 5px;
 }
 #ttcont {
 display:block;
 padding:2px 12px 3px 7px;
 margin-left:5px;
 background:#666;
 color:#fff;
 }
#ttbot {
display:block;
height:5px;
margin-left:5px;
/*background:url(images/tt_bottom.gif) top right no-repeat;*/
overflow:hidden;
border-radius: 5px;
}
  
</style>

<script type="text/javascript" src="javascript/tooltip.js"></script>
<script type="text/javascript" src="javascript/windgram.js"></script> 

<body onload="parseArgsDrawWindgram('windgramtest');" />
    <div style="width:800px;height:800px;margin: 0px auto;">
    <canvas id="windgramtest" width="800" height="800" style="border:1px dotted;"></canvas>
    </div>

<?php
include("PlaceDatabase.php");
$placename=$_GET["placename"];
$lat=$_GET["lat"];
$lng=$_GET["lon"];
$hgt=$_GET["elevation"];

echo "$lat,$lng <br/>$hgt m<br/> $placename <br/>";
// user could just be clicking anywhere, in which case there will be no 
// attached placename... 
if($placename != null)
{
    $forecast=$places[$placename]["forecast"];
    echo "<a href=\"$forecast\">forecast</a>";

    // if there is an associated weather station, show its metar
    if(array_key_exists("airport_station",$places[$placename]))
    {
        $station=$places[$placename]["airport_station"];
        $url="http://aviationweather.gov/adds/metars/?station_ids=$station&std_trans=standard&chk_metars=on&hoursStr=past+4+hours&submitmet=Submit";
    	$metar = file_get_contents("$url");
    	$lines = explode("\n",$metar);
    	$length = count($lines);
    	for($i=0;$i<$length;$i++)
    	{	
        	$line=$lines[$i];
		if(preg_match("/.*$station.*/i",$line))
		{
			$line=preg_replace("/<br>/i","",$line);
	  		echo "<br/>$line";
		}
    	}
    }

    //$hmm=file_get_contents($forecast);
    //echo $hmm;


}
?>

<script type="text/javascript">

function parseArgsDrawWindgram(canvas_id)
{
    var urlvars = getUrlVars();

    var lng=parseFloat(urlvars["lon"]);
    var lat=parseFloat(urlvars["lat"]);
    var launch_elevation=parseFloat(urlvars["elevation"]);
    var placename=urlvars["placename"];
    var base_elevation=0;
    if(urlvars["base_elevation"] != null)
      base_elevation=parseFloat(urlvars["base_elevation"]);

    document.title = placename;
    
    draw_windgram(canvas_id,placename,lat,lng,launch_elevation,base_elevation,'large');
}
</script>

</body>
</html>
