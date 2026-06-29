<!DOCTYPE html>
<html lang="en">
<head>
    <title>SalePro Installer | Step-2</title>
    <link rel="shortcut icon" type="image/x-icon" href="{{ asset('install-assets/images/favicon.ico') }}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="{{ asset('install-assets/css/bootstrap.min.css') }}" rel="stylesheet">
    <link href="{{ asset('install-assets/css/font-awesome.min.css') }}" rel="stylesheet">
    <link href="{{ asset('install-assets/css/style.css') }}" rel="stylesheet">
</head>
<body>
    <div class="col-md-6 offset-md-3">
        <div class='wrapper'>
            <header>
	            <img src="{{ asset('install-assets/images/logo.png') }}" alt="Logo" style="max-width: 120px;"/>
                <h1 class="text-center">SalePro Auto Installer</h1>
            </header>
            <hr>
            <div class="content">
                <?php

                $passed = '';
                $ltext = '';
                if (version_compare(PHP_VERSION, '8.3') >= 0) {
                    $ltext .= '<i class="fa fa-check"></i>Your PHP Version is: ' . PHP_VERSION . '<br/>';
                    $passed .= '1';

                } else {
                    $ltext .= '<i class="fa fa-close"></i>SalePro needs at least PHP version  8.3, Your PHP Version is: ' . PHP_VERSION . '<br/>';
                    $passed .= '0';
                }

                if (extension_loaded('PDO')) {
                    $ltext .= '<i class="fa fa-check"></i>PDO is installed on your server.' . '<br/>';
                    $passed .= '1';
                } else {
                    $ltext .= '<i class="fa fa-close"></i>PDO is not installed on your server.' . '<br/>';
                    $passed .= '0';
                }

                if (extension_loaded('pdo_mysql')) {
                    $ltext .= '<i class="fa fa-check"></i>PDO MySQL driver is enabled on your server.' . '<br/>';
                    $passed .= '1';
                } else {
                    $ltext .= '<i class="fa fa-close"></i>PDO MySQL driver is not enabled on your server.' . '<br/>';
                    $passed .= '0';
                }

                if (extension_loaded('curl')) {
                    $ltext .= '<i class="fa fa-check"></i>php-curl extension is enabled on your server.' . '<br/>';
                    $passed .= '1';
                } else {
                    $ltext .= '<i class="fa fa-close"></i>php-curl extension is not enabled on your server.' . '<br/>';
                    $passed .= '0';
                }

                if (extension_loaded('fileinfo')) {
                    $ltext .= '<i class="fa fa-check"></i>fileinfo extension is installed on your server.' . '<br/>';
                    $passed .= '1';
                } else {
                    $ltext .= '<i class="fa fa-close"></i>fileinfo extension is not installed on your server.' . '<br/>';
                    $passed .= '0';
                }

                if (extension_loaded('gd')) {
                    $ltext .= '<i class="fa fa-check"></i>gd extension is installed on your server.' . '<br/>';
                    $passed .= '1';
                } else {
                    $ltext .= '<i class="fa fa-close"></i>gd extension is not installed on your server.' . '<br/>';
                    $passed .= '0';
                }

                if (extension_loaded('zip')) {
                    $ltext .= '<i class="fa fa-check"></i>zip extension is installed on your server.' . '<br/>';
                    $passed .= '1';
                } else {
                    $ltext .= '<i class="fa fa-close"></i>zip extension is not installed on your server.' . '<br/>';
                    $passed .= '0';
                }

                if (extension_loaded('calendar')) {
                    $ltext .= '<i class="fa fa-check"></i>calendar extension is installed on your server.' . '<br/>';
                    $passed .= '1';
                } else {
                    $ltext .= '<i class="fa fa-close"></i>calendar extension is not installed on your server.' . '<br/>';
                    $passed .= '0';
                }

                if (ini_get('allow_url_fopen')) {
                    $ltext .= '<i class="fa fa-check"></i>allow_url_fopen is enabled on your server.' . '<br/>';
                    $passed .= '1';
                } else {
                    $ltext .= '<i class="fa fa-close"></i>allow_url_fopen is disabled on your server.' . '<br/>';
                    $passed .= '0';
                }

                ?>

                <?php if (substr_count($passed, '0') == 0): ?>
                    <br/><?php echo $ltext; ?><br/>
                    <h5>Great! System Test Completed. You can run SalepPro on your server. Click Continue For Next Step.</h5>
                    <a href="{{ route('install-step-3') }}" class="btn btn-primary">Continue</a>

                <?php else: ?>

                <br/><?php echo $ltext; ?><br/>Sorry. The requirements of SalePro is not available on your server. Please create <a href="https://lion-coders.com/support" target="_blank">support ticket</a> Or contact with your server administrator.<br><br>
                <a href="#" class="btn btn-primary disabled">Correct The Problem To Continue</a>

                <?php endif ?>

            </div>
            <hr>
            <footer>Copyright &copy; LionCoders. All Rights Reserved.</footer>
        </div>
    </div>
</body>
</html>
