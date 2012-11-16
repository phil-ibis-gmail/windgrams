<?php 

// returns the cache file for a place forecasted to an hour.
// a 'valid' field is appended, which is the timestamp that this data is valid for.
// using the filectime and time() functions doesn''t seem to work so well because they
// never seem to reflect new times if overwriting even a file that has been deleted stupid php.

function getCacheFilename($lat,$lng,$hour,$placename)
{
    date_default_timezone_set('UTC');
    $cache_dir = "webcache_".$placename;
    $valid = date('YmdH'); // add an 'i' to the end to make files go out of date once per minute for debugging.
    $cache_filename=$cache_dir."/cache_".$placename."_".$hour."_".$valid.".txt";
    return $cache_filename;
}


function validCachedData($lat,$lng,$hour,$placename)
{
    $cache_filename = getCacheFilename($lat,$lng,$hour,$placename);
    if(file_exists($cache_filename) == TRUE)
    {
        // since the cache_filename has the timestamp including the hour it is valid for, all we need to do is
        // see if the file exists... 
        return TRUE;
    }
    else
    {
        return FALSE;
    }
}

function getCachedData($lat,$lng,$hour,$placename)
{
    $cache_filename = getCacheFilename($lat,$lng,$hour,$placename);
    $retval = "<cache_query>$lng $lat $hour $placename</cache_query>\n";
    $retval = $retval."<cache_file>$cache_filename</cache_file>\n";
    $retval = $retval.file_get_contents("$cache_filename");
    return $retval;
}

function writeCachedData($lat,$lng,$hour,$placename,$data)
{
    $cache_dir = "webcache_".$placename;
    if(!file_exists($cache_dir))
        mkdir($cache_dir);
    $cache_filename = getCacheFilename($lat,$lng,$hour,$placename);
    file_put_contents($cache_filename,$data,LOCK_EX);
}

// if we failed to getLiveData, then mark data as not cacheable.
$isCacheableData=0;


function getLiveData($lat,$lng,$hour,$placename)
{
    // ok, php is silly, I can't access variables outside of function scope unless I explicitly tell it.
    global $isCacheableData;
 
    date_default_timezone_set("GMT");

    $year = date("y");
    $month = date("M");
    $day = date("j");
    $hournow = date("G");
   
    $time = "&year=$year&month_name=$month&mday=$day&hour=$hournow"; 

    $url = "http://www-frd.fsl.noaa.gov/mab/soundings/reply-skewt.cgi?data_source=Op40&lon=$lng&lat=$lat&airport=%28none%29&add_hours=$hour$time";
    $url_contents = file_get_contents($url);
    
    //print(htmlentities($url_contents));
    
    $retval = "<query>$lng $lat $hour $placename</query>\n";
    
    if($url_contents == FALSE)
    {
        $retval=$retval."<error>error getting url</error>\n";
        $isCacheableData = 0;
    }
    else
    {
        $doc = new DOMDocument();
        libxml_use_internal_errors(true);
        $doc->loadHTML($url_contents);
        $test = $doc->getElementsByTagName('pre');
        if($test->length == 0)
        {
            
            $retval = $retval."<error>no pre tag found</error>\n";
            $isCacheableData = 0;
        }
        else
        {
            $pre = $test->item(0);
            $lines = explode("\n",$pre->nodeValue);

            $retval = $retval."<lines>\n";
            $length = count($lines);
            for($i=0;$i<$length;$i++)
            {
                $line = $lines[$i];
                if($i>3 && $i<32)
                {
                    $line=trim($line);
                    $numbers = explode(" ",$line);
             
                    $lineless=trim($lines[$i-1]);
                    $numbersless = explode(" ",$lineless);
             
                    // we only give back the data if the distance between the elevations
                    // is great enough. it makes the graph a bit tidier.
                    if($numbers[0]-$numbersless[0] > 200)
                        $retval = $retval."<line>$line</line>\n";
                }
            }
            $retval = $retval."</lines>";
        }
    }

    libxml_clear_errors();
    return $retval;
}

header('Content-type: text/xml');

$lng=$_GET["lng"];
$lat=$_GET["lat"];
$hour=$_GET["hour"];
$placename="unknown";
if(!empty($_GET["placename"]))
{
    $placename=$_GET["placename"];
    $isCacheableData=1;
}

$xml = "<xml>\n";

if($isCacheableData && (validCachedData($lat,$lng,$hour,$placename) == TRUE))
{
    $xml = $xml.getCachedData($lat,$lng,$hour,$placename);
}
else 
{
    $live_data = getLiveData($lat,$lng,$hour,$placename);
    if($isCacheableData != 0)
    {
        writeCachedData($lat,$lng,$hour,$placename,$live_data);
    }
    $xml = $xml.$live_data; 
}

$xml = $xml."</xml>\n";

print($xml);

?> 
