<?php
require 'assets/libs/vendor/autoload.php';
use Ramsey\Uuid\Uuid;
use Ramsey\Uuid\Exception\UnsatisfiedDependencyException;

class m_admin extends CI_Model{     
    
    public function get($id = null)
    {
        $this->db->select('*');
        $this->db->from('tb_buku');
        if($id != null){
            $this->db->where('id_buku', $id);
        }
        $query = $this->db->get();
        return $query;
    }

    public function tambah_buku($data)
    {
        $this->db->insert('tb_buku', $data);
    }
    public function edit_buku($data)
    {
        $this->db->set($data);
        $this->db->where('id_buku', $data['id_buku']);
        $this->db->update('tb_buku');
    }
    public function hapus_buku($id)
    {
        $this->db->where('id_buku', $id);
        $this->db->delete('tb_buku');
    }
}
?>