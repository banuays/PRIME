<?PHP
$filename = $_POST["logfile"];
$data = $_POST["data"];
$tstamp = $_POST["tstamp"];
$myfile = file_put_contents($filename, $tstamp . ' - ' . $data.PHP_EOL , FILE_APPEND);
?>