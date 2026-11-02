<!-- Primary table start -->
<div class="col-12 mt-5">
    <div class="card">
        <div class="card-body">
            <h4 class="header-title">Data Buku</h4>
            <button type="button" class="btn btn-primary mb-3" data-toggle="modal" data-target="#tambah"><i class="fa fa-plus"></i> Tambah Buku</button>
            <div class="modal fade bd-example-modal-lg" id="tambah">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Tambah Buku</h5>
                            <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
                        </div>                        
                        <?php echo form_open('admin/tambah_buku', array('enctype'=>'multipart/form-data')); ?>
                            <div class="modal-body">
                                <div class="form-group">
                                    <label for="judul_buku" class="col-form-label">Judul Buku</label>
                                    <?php echo form_input(array('class' => 'form-control', 'type' => 'text', 'name' => 'judul_buku', 'id' => 'judul_buku', 'required' => 'required')); ?>
                                </div>
                                <div class="form-group">
                                    <label for="pengarang_buku" class="col-form-label">Pengarang Buku</label>
                                    <?php echo form_input(array('class' => 'form-control', 'type' => 'text', 'name' => 'pengarang_buku', 'id' => 'pengarang_buku', 'required' => 'required')); ?>
                                </div>
                                <div class="form-group">
                                    <label for="penerbit_buku" class="col-form-label">Penerbit Buku</label>
                                    <?php echo form_input(array('class' => 'form-control', 'type' => 'text', 'name' => 'penerbit_buku', 'id' => 'penerbit_buku', 'required' => 'required')); ?>
                                </div>
                                <div class="form-group">
                                    <label for="tahun_terbit" class="col-form-label">Tahun Terbit</label>
                                    <?php echo form_input(array('class' => 'form-control', 'type' => 'number', 'name' => 'tahun_terbit', 'id' => 'tahun_terbit', 'required' => 'required')); ?>
                                </div>
                                <div class="form-group">
                                    <label for="stok_buku" class="col-form-label">Stok Buku</label>
                                    <?php echo form_input(array('class' => 'form-control', 'type' => 'number', 'name' => 'stok_buku', 'id' => 'stok_buku', 'required' => 'required')); ?>
                                </div>
                                <div class="input-group mb-3">
                                    <div class="input-group-prepend">
                                        <span class="input-group-text">Gambar Buku</span>
                                    </div>
                                    <div class="custom-file">
                                        <?php echo form_input(array('class' => 'custom-file-input', 'type' => 'file', 'name' => 'gambar_buku', 'id' => 'gambar_buku', 'required' => 'required')); ?>
                                        <label class="custom-file-label" for="gambar_buku">Pilih Gambar</label>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                <button type="submit" class="btn btn-primary" name="tambah">Tambah Buku</button>
                            </div>
                        <?php echo form_close(); ?>
                    </div>
                </div>
            </div>
            <div class="data-tables datatable-primary">
                <table id="dataTable2" class="text-center">
                    <thead class="text-capitalize">
                        <tr>
                            <th>No.</th>
                            <th>Judul Buku</th>
                            <th>Pengarang</th>
                            <th>Penerbit</th>
                            <th>Tahun terbit</th>
                            <th>Stok Buku</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                            $no = 1;
                            foreach($buku as $data){          
                        ?>
                        <tr>
                            <td><?=$no++."."; ?></td>
                            <td><?=$data->judul_buku; ?></td>
                            <td><?=$data->pengarang_buku; ?></td>
                            <td><?=$data->penerbit_buku; ?></td>
                            <td><?=$data->tahun_terbit; ?></td>
                            <td><?=$data->stok_buku; ?></td>
                            <td>
                            <button id="edit_buku" class="btn btn-flat btn-warning btn-xs mb-3" data-toggle="modal" data-target="#edit" data-id="<?=$data->id_buku; ?>" data-judul="<?=$data->judul_buku; ?>" data-pengarang="<?=$data->pengarang_buku; ?>" data-penerbit="<?=$data->penerbit_buku; ?>" data-tahun="<?=$data->tahun_terbit; ?>" data-stok="<?php echo $data->stok_buku; ?>" data-gambar="<?php echo $data->gambar_buku; ?>">
                                <i class="fa fa-edit"></i>Edit</button>  
                            <a href="<?= site_url('admin/hapus_buku/'.$data->id_buku) ?>" onclick="return confirm('Yakin akan Menghapus Data ini?')">
                            <button class="btn btn-flat btn-danger btn-xs mb-3"><i class="fa fa-trash-o"></i> Hapus</button></a>                      
                            </td>
                        </tr>
                        <?php
                        } ?>
                    </tbody>
                </table>
                <div class="modal fade bd-example-modal-lg" id="edit">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Edit Buku</h5>
                                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
                            </div>                        
                            <form id="form" enctype="multipart/form-data">
                                <div class="modal-body" id="modal-edit">
                                    <div class="form-group">
                                        <label for="judul_buku" class="col-form-label">Judul Buku</label>
                                        <?php echo form_input(array('type' => 'hidden', 'name' => 'id_buku', 'id' => 'id_buku')); ?>
                                        <?php echo form_input(array('class' => 'form-control', 'type' => 'text', 'name' => 'judul_buku', 'id' => 'judul_buku', 'required' => 'required')); ?>
                                    </div>
                                    <div class="form-group">
                                        <label for="pengarang_buku" class="col-form-label">Pengarang Buku</label>
                                        <?php echo form_input(array('class' => 'form-control', 'type' => 'text', 'name' => 'pengarang_buku', 'id' => 'pengarang_buku', 'required' => 'required')); ?>
                                    </div>
                                    <div class="form-group">
                                        <label for="penerbit_buku" class="col-form-label">Penerbit Buku</label>
                                        <?php echo form_input(array('class' => 'form-control', 'type' => 'text', 'name' => 'penerbit_buku', 'id' => 'penerbit_buku', 'required' => 'required')); ?>
                                    </div>
                                    <div class="form-group">
                                        <label for="tahun_terbit" class="col-form-label">Tahun Terbit</label>
                                        <?php echo form_input(array('class' => 'form-control', 'type' => 'number', 'name' => 'tahun_terbit', 'id' => 'tahun_terbit', 'required' => 'required')); ?>
                                    </div>
                                    <div class="form-group">
                                        <label for="stok_buku" class="col-form-label">Stok Buku</label>
                                        <?php echo form_input(array('class' => 'form-control', 'type' => 'number', 'name' => 'stok_buku', 'id' => 'stok_buku', 'required' => 'required')); ?>
                                    </div>                                    
                                    <div style="padding-bottom:5px;">
                                        <img src="" width="50px" id="pict">
                                    </div>
                                    <div class="input-group mb-3">
                                        <div class="input-group-prepend">
                                            <span class="input-group-text">Gambar Buku</span>
                                        </div>
                                        <div class="custom-file">
                                            <?php echo form_input(array('class' => 'custom-file-input', 'type' => 'file', 'name' => 'gambar_buku', 'id' => 'gambar_buku')); ?>
                                            <label class="custom-file-label" for="gambar_buku">Pilih Gambar</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                    <button type="submit" class="btn btn-primary" name="edit">Edit Buku</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <script src="<?= base_url().'assets/js/vendor/jquery-2.2.4.min.js' ?>"></script>
                <script type="text/javascript">
                    $(document).on("click", "#edit_buku", function(){
                        var idbuku = $(this).data('id');
                        var judulbuku = $(this).data('judul');
                        var pengarangbuku = $(this).data('pengarang');
                        var penerbitbuku = $(this).data('penerbit');
                        var tahunterbit = $(this).data('tahun');
                        var stokbuku = $(this).data('stok');
                        var gambarbuku = $(this).data('gambar');
                        $("#modal-edit #id_buku").val(idbuku);
                        $("#modal-edit #judul_buku").val(judulbuku);
                        $("#modal-edit #pengarang_buku").val(pengarangbuku);
                        $("#modal-edit #penerbit_buku").val(penerbitbuku);
                        $("#modal-edit #tahun_terbit").val(tahunterbit);
                        $("#modal-edit #stok_buku").val(stokbuku);
                        $("#modal-edit #pict").attr("src", "<?= base_url() ?>"+"assets/gambar/buku/"+gambarbuku);
                    })
                    $(document).ready(function(){
                        $("#form").on("submit", (function(e){
                            e.preventDefault();
                            $.ajax({
                                url : '<?= site_url("admin/edit_buku") ?>',
                                type :'POST',
                                data : new FormData(this),
                                contentType : false,
                                cache : false,
                                processData : false,
                                success : function(msg){
                                    window.location.href=window.location.href;
                                }
                            });
                        }));
                    })
				</script>
            </div>
        </div>
    </div>
</div>
<!-- Primary table end -->