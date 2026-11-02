<?php
defined('BASEPATH') OR exit('No direct script access allowed');
class Welcome extends CI_Controller {

	public function index()
	{
		$data['judul'] = "Perpustakaan";
		$this->template->halamanutama('index', $data);
	}
	
	function logout(){
		$this->session->sess_destroy();
		redirect(base_url('login'));
	}
}
