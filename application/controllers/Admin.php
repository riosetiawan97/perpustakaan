<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Admin extends CI_Controller {
	function __construct()
	{
		parent::__construct();
		if (!$this->session->userdata('id_user')) {
			redirect(base_url());
		}
		if ($this->session->userdata('level') != "admin") {
			redirect(base_url());
		}
	}
	public function index()
	{
		$data['judul'] = "Perpustakaan | Admin";
		$this->template->halamanadmin('index_admin', $data);
	}
}
