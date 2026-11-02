<?php
defined('BASEPATH') or exit('no direct script access allowed');

class Daftar extends CI_Controller {

    function __construct(){
		parent::__construct();
		$this->load->model('m_daftar');
    }
    
    public function index()
    {
        $data['judul'] = 'Perpustakaan | Daftar';
        $this->load->view('daftar', $data);
    }
    public function proses()
	{
		if(isset($_POST['daftar'])){
			$inputan = $this->input->post(null, TRUE);
			$this->m_daftar->daftar($inputan);
		}
		redirect('login');
	}
}
?>