<?php
class Template{
    function __construct(){
       $this->CI = & get_instance();
    }
    function halamanutama($tengah, $data=null){
        $data['_header'] = $this->CI->load->view('template/_header', $data, true);
        $data['_content'] = $this->CI->load->view($tengah, $data, true);
        $data['_footer'] = $this->CI->load->view('template/_footer', $data, true);
        $this->CI->load->view('template.php', $data);
    }
    function halamanadmin($tengah, $data=null){
        $data['_header'] = $this->CI->load->view('template/_header_admin', $data, true);
        $data['_content'] = $this->CI->load->view($tengah, $data, true);
        $data['_footer'] = $this->CI->load->view('template/_footer_admin', $data, true);
        $this->CI->load->view('template.php', $data);
    }
}
?>