<?php
require 'assets/libs/vendor/autoload.php';
use Ramsey\Uuid\Uuid;
use Ramsey\Uuid\Exception\UnsatisfiedDependencyException;

class m_daftar extends CI_Model{     
    
    public function daftar($data)
    {
        $param = array(
            'id_user' => Uuid::uuid4()->toString(),
            'username' => $data['username'],
            'email' => $data['email'],
            'password' => md5($data['password']),
            'level' => "anggota",
        );
        $this->db->insert('tb_user', $param);
    }
}
?>