<?php
defined('BASEPATH') OR exit('No direct script access allowed');
require 'assets/libs/vendor/autoload.php';
use Ramsey\Uuid\Uuid;
use Ramsey\Uuid\Exception\UnsatisfiedDependencyException;

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
		$this->load->model('m_admin');
	}
	public function index()
	{
		$data['judul'] = "Perpustakaan | Admin";
		$this->template->halamanadmin('index_admin', $data);
	}
	public function tampil_buku()
	{
		$query = $this->m_admin->get();
		$data = array(
			'judul' => 'Perpustakaan | Admin',
			'buku' => $query->result()
		);
		$this->template->halamanadmin('admin/tampil_buku', $data);
	}
	public function tambah_buku()
	{
		if(isset($_POST['tambah'])){
			$this->load->library('upload');
			$nmfile = "Buku-".time();
			$config['upload_path'] = './assets/gambar/buku/';
			$config['allowed_types'] = 'gif|jpg|png|jpeg|bmp';
			$config['file_name'] = $nmfile;
			$this->upload->initialize($config);
			$_FILES['gambar_buku']['name'];
			$this->upload->do_upload('gambar_buku');
			$gbr = $this->upload->data();
			
			$id_buku = Uuid::uuid4()->toString();
			$judul_buku = $this->input->post('judul_buku');
			$pengarang_buku = $this->input->post('pengarang_buku');
			$penerbit_buku = $this->input->post('penerbit_buku');
			$tahun_terbit = $this->input->post('tahun_terbit');
			$stok_buku = $this->input->post('stok_buku');
			$data = array(
				'id_buku' => $id_buku,
				'judul_buku' => $judul_buku,
				'pengarang_buku' => $pengarang_buku,
				'penerbit_buku' => $penerbit_buku,
				'tahun_terbit' => $tahun_terbit,
				'stok_buku' => $stok_buku,
				'gambar_buku' => $gbr['file_name']
				);
			$this->m_admin->tambah_buku($data);
		}
		redirect(base_url().'admin/tampil_buku');
	}
	public function edit_buku()
	{									
		$this->load->library('upload');
		$nmfile = "Buku-".time();
		$config['upload_path'] = './assets/gambar/buku/';
		$config['allowed_types'] = 'gif|jpg|png|jpeg|bmp';
		$config['file_name'] = $nmfile;
		$this->upload->initialize($config);		
		$pict = $_FILES['gambar_buku']['name'];
			if($pict == ''){
				$id_buku = $this->input->post('id_buku');
				$judul_buku = $this->input->post('judul_buku');
				$pengarang_buku = $this->input->post('pengarang_buku');
				$penerbit_buku = $this->input->post('penerbit_buku');
				$tahun_terbit = $this->input->post('tahun_terbit');
				$stok_buku = $this->input->post('stok_buku');
				$data = array(
					'id_buku' => $id_buku,
					'judul_buku' => $judul_buku,
					'pengarang_buku' => $pengarang_buku,
					'penerbit_buku' => $penerbit_buku,
					'tahun_terbit' => $tahun_terbit,
					'stok_buku' => $stok_buku
					);
			}else{
				$this->upload->do_upload('gambar_buku');
				$gbr = $this->upload->data();
				
				$id_buku = $this->input->post('id_buku');
				$judul_buku = $this->input->post('judul_buku');
				$pengarang_buku = $this->input->post('pengarang_buku');
				$penerbit_buku = $this->input->post('penerbit_buku');
				$tahun_terbit = $this->input->post('tahun_terbit');
				$stok_buku = $this->input->post('stok_buku');
				$product = $this->m_admin->get($id_buku);  
				$row = $product->row();     
				unlink("./assets/gambar/buku/".$row->gambar_buku);
				$data = array(
					'id_buku' => $id_buku,
					'judul_buku' => $judul_buku,
					'pengarang_buku' => $pengarang_buku,
					'penerbit_buku' => $penerbit_buku,
					'tahun_terbit' => $tahun_terbit,
					'stok_buku' => $stok_buku,
					'gambar_buku' => $gbr['file_name']
					);
			}			
			$this->m_admin->edit_buku($data);
			redirect(base_url().'admin/tampil_buku');
	}
	public function hapus_buku($id = null)
	{		
		$product = $this->m_admin->get($id);  
		$row = $product->row();     
        unlink("./assets/gambar/buku/".$row->gambar_buku);
		$query = $this->m_admin->hapus_buku($id);
		redirect(site_url('admin/tampil_buku'));
	}
}
