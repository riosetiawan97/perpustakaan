<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class m_login extends CI_Model {

	function cek_login($where, $tabel)
    {
        return $this->db->get_where($tabel,$where);
    }

}