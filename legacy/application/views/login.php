<!doctype html>
<html class="no-js" lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>Login - srtdash</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="shortcut icon" type="image/png" href="<?= base_url().'assets/images/icon/logo2.png' ?>">
    <link rel="stylesheet" href="<?= base_url().'assets/css/bootstrap.min.css' ?>">
    <link rel="stylesheet" href="<?= base_url().'assets/css/font-awesome.min.css' ?>">
    <link rel="stylesheet" href="<?= base_url().'assets/css/themify-icons.css' ?>">
    <link rel="stylesheet" href="<?= base_url().'assets/css/metisMenu.css' ?>">
    <link rel="stylesheet" href="<?= base_url().'assets/css/owl.carousel.min.css' ?>">
    <link rel="stylesheet" href="<?= base_url().'assets/css/slicknav.min.css' ?>">
    <!-- amchart css -->
    <link rel="stylesheet" href="https://www.amcharts.com/lib/3/plugins/export/export.css" type="text/css" media="all" />
    <!-- others css -->
    <link rel="stylesheet" href="<?= base_url().'assets/css/typography.css' ?>">
    <link rel="stylesheet" href="<?= base_url().'assets/css/default-css.css' ?>">
    <link rel="stylesheet" href="<?= base_url().'assets/css/styles.css' ?>">
    <link rel="stylesheet" href="<?= base_url().'assets/css/responsive.css' ?>">
    <!-- modernizr css -->
    <script src="<?= base_url().'assets/js/vendor/modernizr-2.8.3.min.js' ?>"></script>
</head>

<body>
    <!--[if lt IE 8]>
            <p class="browserupgrade">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
        <![endif]-->
    <!-- preloader area start -->
    <div id="preloader">
        <div class="loader"></div>
    </div>
    <!-- preloader area end -->
    <!-- login area start -->
    <div class="login-area login-bg">
        <div class="container">
            <div class="login-box ptb--39">
                <?php echo form_open('login/aksi_login'); ?>
                    <div class="login-form-head">
                        <h4>Login</h4>
                        <p>Masuk ke Website Perpustakaan</p>
                    </div>
                        <?php    
                        if ($this->session->flashdata('error')) {
                            $message = $this->session->flashdata('error');
                            echo "
                            <div class='alert alert-danger alert-dismissible fade show' role='alert'>
                                $message
                                <button type='button' class='close' data-dismiss='alert' aria-label='Close'>
                                    <span class='fa fa-times'></span>
                                </button>
                            </div>
                            ";
                        } ?>
                    <div class="login-form-body">
                        <div class="form-gp">
                            <label for="exampleInputEmail1">Email address</label>
                            <?php echo form_input(array('name' => 'username', 'id' => 'exampleInputEmail1', 'required' => 'required')); ?>
                            <i class="ti-email"></i>
                        </div>
                        <div class="form-gp">
                            <label for="exampleInputPassword1">Password</label>
                            <?php echo form_input(array('type' => 'password', 'name' => 'password', 'id' => 'exampleInputPassword1', 'required' => 'required')); ?>
                            <i class="ti-lock"></i>
                        </div>
                        <div class="row mb-4 rmber-area">
                            <div class="col-6">
                                <div class="custom-control custom-checkbox mr-sm-2">
                                <?php echo form_input(array('type' => 'checkbox', 'name' => 'remember', 'id' => 'customControlAutosizing', 'class' => 'custom-control-input')); ?>
                                    <label class="custom-control-label" for="customControlAutosizing">Ingatkan Saya</label>
                                </div>
                            </div>
                            <div class="col-6 text-right">
                                <a href="#">Lupa Password?</a>
                            </div>
                        </div>
                        <div class="submit-btn-area">
                            <button id="form_submit" type="submit">Masuk <i class="ti-arrow-right"></i></button>
                        </div>
                        <div class="form-footer text-center mt-5">
                            <p class="text-muted">Belum Punya Akun? <a href=<?= base_url().'daftar'; ?>>Daftar</a></p>
                        </div>
                    </div>
                <?php echo form_close(); ?>
            </div>
        </div>
    </div>
    <!-- login area end -->

    <!-- jquery latest version -->
    <script src="<?= base_url().'assets/js/vendor/jquery-2.2.4.min.js' ?>"></script>
    <!-- bootstrap 4 js -->
    <script src="<?= base_url().'assets/js/popper.min.js' ?>"></script>
    <script src="<?= base_url().'assets/js/bootstrap.min.js' ?>"></script>
    <script src="<?= base_url().'assets/js/owl.carousel.min.js' ?>"></script>
    <script src="<?= base_url().'assets/js/metisMenu.min.js' ?>"></script>
    <script src="<?= base_url().'assets/js/jquery.slimscroll.min.js' ?>"></script>
    <script src="<?= base_url().'assets/js/jquery.slicknav.min.js' ?>"></script>
    
    <!-- others plugins -->
    <script src="<?= base_url().'assets/js/plugins.js' ?>"></script>
    <script src="<?= base_url().'assets/js/scripts.js' ?>"></script>
</body>

</html>