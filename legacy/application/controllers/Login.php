<?php
defined('BASEPATH') or exit('no direct script access allowed');

class Login extends CI_Controller {

    function __construct(){
		parent::__construct();		
		if ($this->session->userdata('id_user')) {
			redirect(base_url());
		}
		$this->load->model('m_login');
    }
    
    public function index()
    {
        $data['judul'] = 'Perpustakaan | Login';
        $this->load->view('login', $data);
    }

    function aksi_login(){
		$username = $this->input->post('username');
		$password = $this->input->post('password');
		$remember = $this->input->post('remember');
		$where = array(
			'username' => $username,
			'password' => md5($password)
			);
		$cek = $this->m_login->cek_login($where, "tb_user")->num_rows();
		if($cek > 0){
			$print = $this->m_login->cek_login($where, "tb_user")->result();
			foreach ($print as $value) {
				$data_session['id_user'] 	= $value->id_user;
				$data_session['username'] 	= $value->username;
				$data_session['level'] = $value->level;
			}
 
			$this->session->set_userdata($data_session);
			if ($data_session['level'] == "admin") {
				redirect(base_url("admin"));
			}else{
				redirect(base_url());
			}
 
		}else{
			$this->session->set_flashdata('error', 'Username atau password salah !');
			redirect(base_url("login"));
		}
	}
 
}
?>