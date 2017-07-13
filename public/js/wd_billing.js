// bugtrack.js (node.js version)
//
// Ron Patterson, WildDog Design

// some utility functions
if (typeof(String.trim) == 'undefined')
{
	String.prototype.trim = function()
	{
		return this.replace(/^\s+/,'').replace(/\s+$/,'');
	}
}

if (typeof(String.blank) == 'undefined')
{
	String.prototype.blank = function()
	{
		return /^\s*$/.test(this);
	}
}

var wdb = // setup the wdb namespace
{

	login_content: { 'uid': 'rlpatter' },
	stimer: 0,
	group_def: 'WDD', // default group
	group_data: {},
	bug_doc: {},

	check_session: function (event)
	{
		var params = "action=wdb_check_session";
		$.ajax({
			url: 'wdb_check_session',
			type: 'post',
			data: params,
			dataType: 'html'
		}).done(function (response)
		{
			if (response == 0)
			{
				if (wdb.stimer != 0) window.clearInterval(wdb.stimer);
				wdb.stimer = 0;
				wdb.login_form();
			}
			else
			{
				$('#wdb_user_heading').show();
			}
		});
		return false;
	},

	login_form: function (event)
	{
		if (wdb.stimer != 0) window.clearInterval(wdb.stimer);
		wdb.stimer = 0;
		$('#wdb_user_heading').hide();
		$('#wdb_login_form input[type="password"]').val('');
		$('#dialog-login').dialog({
			width: 400,
			maxHeight: 700,
			modal: true,
			title: 'WD Billing Login',
			show: 'fade',
			hide: 'fade',
			draggable: false,
			resizeable: false,
			closeOnEscape: false,
			dialogClass: "no-close"
			//beforeClose: function( event, ui ) {return false;}
		});
		$('#login_errors').html('');
		$('#wdb_login_form').on('submit',wdb.login_handler);
		$('input[name="uid"]').focus();
		return false;
	},

	login_handler: function (event)
	{
		var params = "action=wdb_login_handler";
		params += '&'+$('#wdb_login_form').serialize();
		$.ajax({
			url: 'wdb_login_handler',
			type: 'post',
			data: params,
			dataType: 'html'
		}).done(function (response)
		{
			if (/FAIL/.test(response))
			{
				$('#login_errors').html(response);
				return false;
			}
			else
			{
				var row = $.parseJSON(response);
				$('#dialog-login').dialog('close');
// 					var user = $('<div></div>')
// 						.css('position','absolute')
// 						.css('width','30em')
// 						.css('top','15px')
// 						.css('right','1em')
// 						.css('text-align','right')
// 						.css('font-size','9pt')
// 						.html('Welcome '+row.fname+' '+'<a href="#" onclick="return wdb.logout_handler();">Logout</a>');
// 					$('body').append(user);
				$('#wdb_user_name_top').html(row.fname+' '+row.lname);
				$('#wdb_user_heading').show();
				$('#wdb_admin_btn').show();
				if (!/admin/.test(row.roles)) $('#wdb_admin_btn').hide();
				wdb.stimer = window.setInterval(wdb.check_session,300000);
			}
		});
		return false;
	},

	logout_handler: function (event)
	{
		var params = "action=wdb_logout_handler";
		$.ajax({
			url: 'wdb_logout_handler',
			type: 'post',
			data: params,
			dataType: 'html'
		});
		window.setTimeout(wdb.check_session,1000); // a bit of a delay
		return false;
	},

	projlist: function ( event, type )
	{
		//console.log(event,type);
		var type2 = type ? type : '';
		var sel_val = {};
		if (type2 == 'bytype')
		{
			//sel_val = " and bug_type = '"+$('select[name="bug_type2"]').val()+"'";
			sel_val = {"proj_type": $('select[name="proj_type2"]').val()};
		}
		if (type2 == 'bystatus')
		{
			//sel_val = " and b.status = '"+$('select[name="status2"]').val()+"'";
			sel_val = {"status": $('select[name="status2"]').val()};
		}
		//$('#content_div').html(response);
		$('#content_div').show();
		wdb.projlist2(event, type2, sel_val);
		return false;
	},

	projlist2: function ( event, type, sel_arg )
	{
		//console.log(event,type,sel_arg);
		var params = {
			'action': 'list2',
			'type': type,
			'sel_arg': JSON.stringify(sel_arg)
		};
		$('#wdb_tbl tbody').off( 'click', 'button');
		var table = $('#wdb_tbl').DataTable({
			'ajax': {
				'url': 'proj_list',
				'type': 'get',
				'data': params
			},
			'destroy': true,
			'order': [[ 0, "asc" ]],
			'columns': [
				{'data': 'proj_cd'},
				{'data': 'name'},
				{'data': 'client'},
				{'data': 'entry_dtm'},
				{'data': 'status'},
				null
			],
			'columnDefs': [ {
				'targets': -1,
				'data': null,
				'defaultContent': '<button>Show</button>'
			} ]
		});
		$('#wdb_tbl tbody').on( 'click', 'button', function () {
			var data = table.row( $(this).parents('tr') ).data();
			//alert( 'id='+data[4]);
			wdb.projshowdialog(event,data._id);
		} );
		$('#wdb_bugs_list').show();
		return false;
	},

	projadd: function ( event )
	{
		wdb.showDialogDiv('WD Billing Project Add','wdb_projs_show_edit');
		$('#projedit_errors').html('');
		$('#projedit_form1 input[type="text"]').val('');
		$('#projedit_form1 textarea').val('');
		$('#euser').html(wdb.login_content.uid);
		$('input[name="pid"]').val('');
		$('select[name="wdb_group"]').val(wdb.group_def);
		$('select[name="bug_type"]').val('');
		$('select[name="status"]').val('o');
		$('#assignedDiv2').html('');
		$('#wdb_assign_btn2').hide();
		$('select[name="priority"]').val('3');
		$('#filesDiv,#bfiles,#assignedDiv').html('');
		$('.wdb_date').html('');
		$('#bugshow_div').hide();
		$('#bugedit_div').show();
		return false;
	},

	edit_proj: function ( event, id )
	{
		var id2 = $('#pid').val();
		if (id) id2 = id;
		//alert('edit_proj '+id2);
		var params = "action=edit&id="+id2;
		$.ajax({
			url: 'proj_get',
			type: 'get',
			data: params,
			dataType: 'json'
		}).done(function (data)
		{
			//$('#content_div').html(response);
			//$('#bugshow_div').dialog('close');
			//wdb.showDialogDiv('BugTrack Bug '+data.bug_id,'wdb_bugs_show_edit');
			$('#bugedit_errors').html('');
			$('#bugedit_id').html(data.bug_id);
			$('#oldstatus').val(data.status);
			var grp = data.bug_id.replace(/\d+$/,'');
			$('select[name="wdb_group"]').val(grp);
			$('input[name="descr"]').val(data.descr);
			$('input[name="product"]').val(data.product);
			$('select[name="bug_type"]').val(data.bug_type);
			$('select[name="status"]').val(data.status);
			$('select[name="priority"]').val(data.priority);
			$('#assignedDiv2').html(data.aname);
			$('#wdb_assign_btn2').show();
			$('textarea[name="comments"]').val(data.comments);
			$('textarea[name="solution"]').val(data.solution);
			$('#edtm').html(data.edtm);
			$('#udtm').html(data.udtm);
			$('#cdtm').html(data.cdtm);
// 			$('#bdate').datepicker(
// 			{
// 				yearRange: '-80:+1',
// 				changeMonth: true,
// 				changeYear: true
// 			});
			$('#bugshow_div').hide();
			$('#bugedit_div').show();
		});
		return false;
	},
	
	projshowdialog: function ( event, id )
	{
		wdb.showDialogDiv('WD Billing Project','wdb_projs_show_edit');
		wdb.projshow(event,id);
		return false;
	},

	projshow: function ( event, id )
	{
		//alert(id);
		//var id2 = parseInt(id.replace(/[^\d]/g,''));
		var params = "action=show&id="+id;
		$.ajax({
			url: 'proj_get',
			type: 'get',
			data: params,
			dataType: 'json'
		}).done(function (data)
		{
			//console.log(data);
			wdb.proj_doc = data;
			$('#wdb_projs_show_edit').dialog('option','title','WD Billing Project '+data.bug_id);
			var group_cd = data.bug_id.replace(/\d+$/,'');
			$('#wdb_admin_errors').html('');
			$('#proj_cd').val(data.proj_cd);
			$('#proj_cd2_v').html(data.proj_cd);
			$('#pid').val(id);
			$('#group_v').html(wdb.get_lookup(wdb.group_data.wdb_group,group_cd));
			$('#descr_v').html(data.descr);
			$('#product_v').html(data.product);
			$('#wdb_v').html(wdb.get_lookup(wdb.group_data.wdb_type,data.bug_type));
			$('#status_v').html(data.status_descr);
			$('#priority_v').html(data.priority_descr);
			$('#assignedDiv1').html(data.aname);
			$('#comments_v').html(data.comments);
			$('#solution_v').html(data.solution);
			$('#ename_v').html(data.ename);
			$('#edtm_v').html(data.edtm);
			$('#udtm_v').html(data.udtm);
			$('#cdtm_v').html(data.cdtm);
			wdb.get_files(event);
			wdb.worklog_show(event,data);
			wdb.bug_save_cancel();
			$('#bugshow_div').show();
		});
		return false;
	},

	worklog_show: function ( event, data )
	{
		$('#wdb_worklog_div').empty();
		var div = $('#wdb_worklog_div');
		if (!data.worklog || data.worklog.length == 0)
			div.html('No worklog records');
		else
		{
			var tbl = $('<table></table>');
			div.append(tbl);
			var wl = data.worklog;
			for (var x=0; x<wl.length; ++x)
			{
			    var uname = wdb.group_data.users[wl[x].user_nm] ? wdb.group_data.users[wl[x].user_nm].name : 'n/a';
				var tr = $('<tr><th>Date/Time: '+wl[x].edtm+' by '+uname+'</th></tr>');
				div.append(tr);
				tr = $('<tr><td>'+wdb.nl2br(wl[x].comments)+'<hr></td></tr>');
				div.append(tr);
			}
		}
	},

	bug_save_cancel: function( event )
	{
		$('#bugshow_div').show();
		$('#bugedit_div').hide();
		return false;
	},

	bughelp: function ( event )
	{
		wdb.showDialogDiv('BugTrack Help','bughelp_div');
		return false;
	},

	bughandler: function( event )
	{
		//alert('bughandler '+$('#bugedit_form1').serialize()); return false;
		var err = wdb.validate();
		if (err != '')
		{
			$('#bugedit_errors').html('Errors encountered:<br>'+err);
			return false;
		}
		$('#bugedit_errors').html('');
		var params = 'action=add_update&'+$('#bugedit_form1').serialize();
		params += '&id='+$('#bid').val();
		params += '&bug_id='+$('#bug_id').val();
		params += '&user_id='+$('#userid').val();
		//alert('bughandler '+params);
		$.ajax({
			url: 'bug_add_update',
			type: 'post',
			data: params,
			dataType: 'html'
		}).done(function (response)
		{
		    //console.log(response);
			if (!/SUCCESS/.test(response))
			{
				$('#bugedit_errors').html(response);
			}
			else
			{
				wdb.buglist(event);
				if ($('#bid').val() == '') {
				    wdb.bug_save_cancel(event);
				    var arr = response.split(/ ,/);
				    wdb.bugshow(event,arr[1]);
				}
				else wdb.bugshow(event,$('#bid').val());
				//$('#wdb_bugs_list_edit').dialog('close');
				//window.setTimeout(function(e) {$('#bugedit_div').dialog('close');},3000);
			}
		});
		return false;
	},

	delete_bug: function ( event )
	{
		if (!confirm("Really delete this entry?")) return false;
		var params = 'action=delete';
		params += '&id='+$('#bid').val();
		$.ajax({
			url: 'bug_delete',
			type: 'post',
			data: params,
			dataType: 'html'
		}).done(function (response)
		{
			if (/^SUCCESS/.test(response))
			{
				$('#wdb_bugs_show_edit').dialog('close');
				wdb.buglist(event);
			}
			else
				alert(response);
		});
		return false;
	},

	assign_search: function ( event )
	{
		//alert('assign_search');
		wdb.showDialogDiv('BugTrack Assign','wdb_users_search', 700);
		return false;
	},

	handle_search: function ( event )
	{
		$('#wdb_user_assign_tbl tbody').off( 'click', 'button');
		var f = document.wdb_form9;
		var table = $('#wdb_user_assign_tbl').DataTable({
			'ajax': {
				'url': 'admin_users',
				'type': 'get',
				'data': {
					'action': 'getUsersSearch',
					'lname': f.lname.value,
					'fname': f.fname.value
				}
			},
			'destroy': true,
			'order': [[ 0, "asc" ]],
			'columns': [
				{'data': 'uid'},
				{'data': 'name'},
				{'data': 'email'},
				{'data': 'roles'},
				{'data': 'active'},
				null
			],
			'columnDefs': [ {
				'targets': -1,
				'data': null,
				'defaultContent': '<button>Select</button>'
			} ]
		});
		$('#wdb_user_assign_tbl tbody').on( 'click', 'button', function () {
			var data = table.row( $(this).parents('tr') ).data();
			//alert( 'user='+data[0]);
			wdb.assign_user(event,data.uid);
		} );
		return false;
	},

	assign_user: function ( event, user )
	{
		var id = $('#bid').val();
		var params = 'action=assign_user';
		params += '&id='+id;
		params += '&uid='+user;
		$.ajax({
			url: 'assign_user',
			type: 'post',
			data: params,
			dataType: 'html'
		}).done(function (response)
		{
			$('#wdb_users_search').dialog('close');
			wdb.bugshow(event,id);
		});
		return false;
	},

	add_worklog: function ( event ) {
		wdb.showDialogDiv('BugTrack Worklog','wdb_worklog_form');
		$('#wdb_wl_bug_id').html($('#bug_id2_v').text());
		$('#wdb_wl_descr').html($('#descr_v').html());
		$('#wdb_bug_comments').html($('#comments_v').html());
		$('input[name="wl_public"][value="n"]').prop('checked',true);
		$('textarea[name="wl_comments"]').val('');
		$('#wdb_wl_ename').html($('#usernm').html());
		$('#wdb_wl_entry_dtm').html($('#edtm_v').html());
		$('#wl_errors').html('');
		$('textarea[name="wl_comments"]').focus();
		return true;
	},

	workloghandler: function( event ) {
		//alert('workloghandler '+$('#wdb_form2').serialize()); return false;
		//var err = wdb.validate();
		var err = '';
		if ($('textarea[name="wl_comments"]').val().blank())
			err += ' - Worklog Comments must not be blank<br>';
		if (err != '')
		{
			$('#wl_errors').html('Errors encountered:<br>'+err);
			return false;
		}
		var id = $('#bid').val();
		var params = 'action=worklog_add&'+$('#wdb_form2').serialize();
		params += '&usernm='+$('#userid').val();
		params += '&id='+id;
		params += '&bug_id='+$('#bug_id').val();
		//alert('workloghandler '+params);
		$.ajax({
			url: 'worklog_add',
			type: 'post',
			data: params,
			dataType: 'html'
		}).done(function (response)
		{
			if (/^SUCCESS/.test(response))
			{
				$('#wdb_worklog_form').dialog('close');
				wdb.bugshow(event,$('#bid').val());
				//window.setTimeout(function(){wdb.bugshow(event,id);},200);
			}
			else
				$('#wl_errors').html(response);
		});
		return false;
	},

	get_worklog: function (id) {
		$('#worklogDiv').html("Loading...");
		//alert("search_list called");
		$('#worklogDiv').load('bugworklogAjax.php', { id: id });
		return false;
	},

	get_files: function ( event )
	{
		$('#filesDiv').empty();
        var out = '';
        var data = typeof(wdb.bug_doc.attachments) == 'object' ? wdb.bug_doc.attachments : [];
        if (data.length == 0)
            out = 'No attachments';
        else
        {
            $.each(data,function (i)
            {
                var id = $('#bid').val();
                out += '<a href="src/get_file.html?id='+id+'&idx='+i+'" target="_blank">'+data[i].file_name+'</a> ('+data[i].file_size+') <span onclick="return wdb.remove_file(\''+id+'\','+i+');" style="cursor: pointer;">Remove</span><br>';
            });
        }
        $('#filesDiv').html(out);
	},

	attach_file: function ( event )
	{
		//$('errors').update();
		$('#update_list').val("0");
		//alert("add_file called");
//		w = window.open('views/add_file.html?id='+$('#bid').val()+'&bug_id='+$('#bug_id').val(), 'Add_file', 'width=620,height=280,resizable,menubar,scrollbars');
		w = window.open('src/add_file.html?id='+$('#bid').val()+'&bug_id='+$('#bug_id').val(), 'Add_file', 'width=620,height=280,resizable,menubar,scrollbars');
		//setTimeout("watch_add(w)",2000);
		wdb.get_files(event);
		return false;
	},

	remove_file: function ( id, idx )
	{
		if (!confirm('Really remove this attachment file?')) return false;
		var params = 'action=remove_file';
		params += '&id='+id;
		params += '&idx='+idx;
		$.ajax({
			url: 'attachment_delete',
			type: 'post',
			data: params,
			dataType: 'html'
		}).done(function (response)
		{
			console.log(response);
    		wdb.get_files(null);
		});
		return false;
	},

	show_email: function ( event ) {
		wdb.showDialogDiv('BugTrack Email','wdb_email_div');
		$('#bug_id_email').html($('#bug_id2_v').text());
		$('#descr_email').html($('#descr_v').html());
		$('input[name="subject"]').val($('#bug_id2_v').text()+' - '+$('#descr_v').html());
		$('#email_errors').html('');
		return true;
	},

	email_bug: function (e) {
		var err = '';
		if ($('input[name="sendto"]').val().blank())
			err += ' - Send To must not be blank<br>';
		if ($('input[name="subject"]').val().blank())
			err += ' - Subject must not be blank<br>';
		if (err != '')
		{
			$('#email_errors').html('Errors encountered:<br>'+err);
			return false;
		}
		var params = 'action=email_bug';
		params += '&id='+$('#bid').val();
		params += '&bug_id='+$('#bug_id').val();
		params += '&'+$('#bug_email_form').serialize();
		$.ajax({
			url: 'bug_email',
			type: 'post',
			data: params,
			dataType: 'html'
		}).done(function (response)
		{
			$('#email_errors').html(response);
		});
		return false;
	},

	validate: function ( )
	{
		var datere = /^[01][0-9]\/[0-3][0-9]\/(19|20)[0-9]{2}$/;
		var err = '';
		var f = document.wdb_form1;
		if (f.descr.value.blank())
			err += ' - Description must not be blank<br>';
		if (f.product.value.blank())
			err += ' - Product or Application must not be blank<br>';
		if (f.bug_type.value.blank())
			err += ' - Bug Type must be selected<br>';
		if (f.comments.value.blank())
			err += ' - Comments must not be blank<br>';
	// 	if (!datere.test($('#bdate').val()))
	// 		err += ' - Birth date is not valid (mm/dd/yyyy)<br>';
		return err;
	},

	bugadmin: function ( event )
	{
	    var codes = ["wdb_type","wdb_group","wdb_status","wdb_priority","wdb_users"];
	    var descrs = ["Type","Group","Status","Priority","Users"];
		var obj = $('<select></select>');
		var opt = $('<option></option>').attr('value','').html('--Select One--');
		obj.append(opt);
		for (var i=0; i<codes.length; ++i)
		{
			var opt = $('<option></option>').attr('value',codes[i]).html(descrs[i]);
			obj.append(opt);
		}
		$('#wdb_admin_types').empty().append(obj);
		wdb.showDialogDiv('BugTrack Admin','wdb_admin',700);
		$('#wdb_admin_lu_add').on('click',wdb.bugadmin_lu_add);
		$('#wdb_admin_users_add').on('click',wdb.user_add);
		$('#wdb_admin_types select').on('change',wdb.bugadmin_lu);
		//wdb.bugadmin_users();
		$('.bugadmin').hide();
		$('#wdb_admin_head').show();
		return false;
	},
	
	bugadmin_lu: function ( event )
	{
		$('.bugadmin').hide();
		var type = $('#wdb_admin_types select').val();
		switch (type)
		{
		    case 'wdb_type':
		    case 'wdb_group':
		    case 'wdb_status':
		    case 'wdb_priority':
        		wdb.bugadmin_lu_list(type);
        	    break;
		    case 'wdb_users':
        		wdb.bugadmin_users();
        	    break;
        	default:
        	    alert('ERROR: Unknown type ('+type+')');
		}
	},

	bugadmin_lu_list: function ( type )
	{
		$('#wdb_lu_tbl tbody').off( 'click', 'button');
		$.ajax({
			url: 'admin_lu_list',
			type: 'get',
			dataType: 'json',
			data: 'action=admin_lu_get&type='+type
		}).done(function (data)
		{
            var table = $('#wdb_lu_tbl').DataTable({
                'data': data.data,
                'destroy': true,
                'order': [[ 0, "asc" ]],
                'columns': [
                    {'data': 'cd'},
                    {'data': 'descr'},
                    {'data': 'active'},
                    null
                ],
                'columnDefs': [ {
                    'targets': -1,
                    'data': null,
                    'defaultContent': '<button>Edit</button>'
                } ]
            });
            $('#wdb_lu_tbl tbody').on( 'click', 'button', function () {
                var data = table.row( $(this).parents('tr') ).data();
                //alert( 'user='+data[0]);
                //console.log(data);
                wdb.bugadmin_lu_show(event,type,data.cd);
            } );
		});
		$('#wdb_lu_list').show();
		$('#wdb_lu_form').hide();
		return false;
	},

	bugadmin_lu_add: function ( event )
	{
		//wdb.showDialogDiv('Lookup Add','bugadmin_lu_add');
		$('#wdb_lu_errors').html('');
		$('#wdb_users_form input[type="text"]').val('');
		$('input[name="cd"]').removeAttr('readonly');
		$('input[name="active"]').removeAttr('checked');
		$('input[name="active"][value="y"]').prop('checked',true);
        $('input[name="lu_type"]').val($('#wdb_admin_types select').val());
        $('input[name="lu_action"]').val('add');
		$('#wdb_lu_list').hide();
		$('#wdb_lu_form').show();
	},

	bugadmin_lu_show: function ( event, type, cd )
	{
		var params = "action=bug_lu_show";
		params += '&type='+type;
		$.ajax({
			url: 'admin_lu_get',
			type: 'get',
			data: params,
			dataType: 'json'
		}).done(function (data)
		{
			//console.log(data);
			var rec = {};
            for (var i=0; i<data.length; ++i)
            {
                var item = data[i];
                if (cd == item.cd)
                {
                    rec = item;
                    break;
                }
            }
			$('#wdb_lu_errors').html('');
			$('input[name="cd"]').val(cd);
			$('input[name="cd"]').attr('readonly',true);
			$('input[name="descr"]').val(rec.descr);
			$('input[name="active"]').removeAttr('checked');
			if (rec.active == 'y') $('input[name="active"][value="y"]').prop('checked',true);
			else $('input[name="active"][value="n"]').prop('checked',true);
			$('input[name="lu_type"]').val(type);
			$('input[name="lu_action"]').val('change');
		});
		$('#wdb_lu_list').hide();
		$('#wdb_lu_form').show();
		return false;
	},

	luhandler: function( event ) {
		//alert('luhandler '+$('#wdb_lu_form_id').serialize());
// 		var err = wdb.validate();
		var f = document.wdb_lu_form;
		var err = '';
		if (f.cd.value.blank())
			err += " - Code must not be blank<br>";
		//console.log(f.lu_action.value,f.lu_type.value,f.cd.value.trim(),wdb.get_lookup(wdb.group_data[f.lu_type.value],f.cd.value.trim())); return false;
		if (f.lu_action.value == 'add'
		  && wdb.get_lookup(wdb.group_data[f.lu_type.value],f.cd.value.trim()) != 'n/a')
			err += " - Code is already used<br>";
		if (f.descr.value.blank())
			err += " - Description must not be blank<br>";
		if (err != '')
		{
			$('#wdb_lu_errors').html('Errors encountered:<br>'+err);
			return false;
		}
		var params = 'action=lu_add_update';
		params += '&'+$('#wdb_lu_form_id').serialize();
		//alert('userhandler '+params); return false;
		$.ajax({
			url: 'lu_add_update',
			type: 'post',
			data: params,
			dataType: 'html'
		}).done(function (response)
		{
			$('#wdb_lu_errors').html(response);
			wdb.reload_lookups();
			wdb.bugadmin_lu_list(f.lu_type.value);
		});
		return false;
	},

	lu_save_cancel: function( event )
	{
		$('#wdb_lu_list').show();
		$('#wdb_lu_form').hide();
		return false;
	},

	bugadmin_users: function ( event )
	{
		$('#wdb_user_tbl tbody').off( 'click', 'button');
		$.ajax({
			url: 'admin_users',
			type: 'get',
			dataType: 'json'
		}).done(function (data)
		{
            var table = $('#wdb_user_tbl').DataTable({
                'data': data.data,
                'destroy': true,
                'order': [[ 0, "asc" ]],
                'columns': [
                    {'data': 'uid'},
                    {'data': 'name'},
                    {'data': 'email'},
                    {'data': 'roles'},
                    {'data': 'active'},
                    null
                ],
                'columnDefs': [ {
                    'targets': -1,
                    'data': null,
                    'defaultContent': '<button>Edit</button>'
                } ]
            });
            $('#wdb_user_tbl tbody').on( 'click', 'button', function () {
                var data = table.row( $(this).parents('tr') ).data();
                //alert( 'user='+data[0]);
                //console.log(data);
                wdb.user_show(event,data.uid);
            } );
		});
		$('#wdb_users_list').show();
		$('#wdb_users_form').hide();
		return false;
	},

	user_add: function ( event )
	{
		//wdb.showDialogDiv('User Add','wdb_users_form');
		$('#wdb_admin_errors').html('');
		$('#wdb_users_form input[type="text"]').val('');
		$('input[name="pw"]').val('');
		$('input[name="pw2"]').val('');
		$('input[name="uid1"]').val('');
		$('input[name="uid1"]').removeAttr('readonly');
		$('input[name="uid"]').val('');
		$('input[name="id"]').val('');
		$('input[name="active"]').removeAttr('checked');
		$('input[name="active"][value="y"]').prop('checked',true);
		$('input[name="roles"]').removeAttr('checked');
		$('input[name="roles"][value="user"]').prop('checked',true);
		$('select[name="wdb_group"]').val('');
		$('#wdb_users_list').hide();
		$('#wdb_users_form').show();
	},

	user_show: function ( event, uid )
	{
		uid2 = !uid ? '' : uid;
		var params = "action=wdb_user_show";
		params += '&uid='+uid2;
		$.ajax({
			url: 'user_get',
			type: 'get',
			data: params,
			dataType: 'json'
		}).done(function (data)
		{
			//console.log(data);
			//wdb.showDialogDiv('User Edit','wdb_users_form');
			//$('#wdb_user_form_id').on('submit',wdb.userhandler);
			$('#wdb_admin_errors').html('');
			$('input[name="uid"]').val(uid);
			$('input[name="id"]').val(data._id);
			$('input[name="uid1"]').val(uid);
			$('input[name="uid1"]').attr('readonly',true);
			$('input[name="lname"]').val(data.lname);
			$('input[name="fname"]').val(data.fname);
			$('input[name="email"]').val(data.email);
			$('input[name="active"]').removeAttr('checked');
			if (data.active == 'y') $('input[name="active"][value="y"]').prop('checked',true);
			else $('input[name="active"][value="n"]').prop('checked',true);
			$('input[name="roles"]').removeAttr('checked');
			if (data.roles == 'admin') $('input[name="roles"][value="admin"]').prop('checked',true);
			else if (data.roles == 'ro') $('input[name="roles"][value="ro"]').prop('checked',true);
			else $('input[name="roles"][value="user"]').prop('checked',true);
			$('input[name="pw"]').val(data.pw);
			$('input[name="pw2"]').val(data.pw);
			$('select[name="wdb_group"]').val(data.wdb_group);
		});
		$('#wdb_users_list').hide();
		$('#wdb_users_form').show();
		return false;
	},

	user_save_cancel: function( event )
	{
		$('#wdb_users_list').show();
		$('#wdb_users_form').hide();
		return false;
	},

	userhandler: function( event ) {
		//alert('userhandler '+$('#wdb_user_form_id').serialize());
		var emailre = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,6})+$/;
// 		var err = wdb.validate();
		var f = document.wdb_user_form;
		var err = '';
		if (f.uid1.value.blank())
			err += " - UID must not be blank<br>";
		if (f.lname.value.blank())
			err += " - Last Name must not be blank<br>";
		if (!emailre.test(f.email.value))
			err += ' - Email is not valid<br>';
		if (f.wdb_group.value.blank())
			err += " - Group must be selected<br>";
		if (err != '')
		{
			$('#wdb_admin_errors').html('Errors encountered:<br>'+err);
			return false;
		}
		var params = 'action=user_add_update';
		params += '&'+$('#wdb_user_form_id').serialize();
		//alert('userhandler '+params); return false;
		$.ajax({
			url: 'user_add_update',
			type: 'post',
			data: params,
			dataType: 'html'
		}).done(function (response)
		{
			$('#wdb_admin_errors').html(response);
			wdb.bugadmin_users(event);
		});
		return false;
	},

	assign_locate: function ( file )
	{
		$.get(
			file,
			function (response)
			{
				wdb.showDialog('BugTrack Maintenance',response);
			}
		);
		return false;
	},

	showDialog: function ( title, content )
	{
		//if ($('#dialog-modal').dialog) $('#dialog-modal').dialog('destroy');
		$('#dialog-content').html(content);
		$('#dialog-modal').dialog({
		  width: 600,
		  maxHeight: 700,
		  modal: true,
		  title: title,
		  show: 'fade',
		  hide: 'fade',
		  close: function (e,ui)
		  {
			$(this).dialog('destroy');
		  }
		});
	},

	showDialogDiv: function ( title, div, width )
	{
		//alert('showDialogDiv');
		var w = width ? width : 600;
		$('#'+div).dialog({
		  width: w,
		  maxHeight: 700,
		  modal: true,
		  title: title,
		  show: 'fade',
		  hide: 'fade',
		  close: function (e,ui)
		  {
		  	$('#'+div+' > div.bugform').hide();
			$(this).dialog('destroy');
		  }
		});
	},

	bugCancelDialog: function ( event )
	{
		if ($('#bugedit_id').text() == '')
			$('#wdb_bugs_show_edit').dialog('close');
		else
		{
			$('#bugshow_div').show();
			$('#bugedit_div').hide();
		}
		wdb.buglist();
	},

	worklogCancelDialog: function ( event )
	{
		$('#wdb_worklog_form').dialog('close');
		wdb.buglist();
	},

	nl2br: function ( val )
	{
		return val.replace(/\r?\n/g,'<br>');
	},

	/**
	 * @param name string
	 * @param data array({val,text},...);
	 */
	build_selection: function ( name, data )
	{
		//debugger;
		var obj = $('<select></select>').attr('name',name);
		var opt = $('<option></option>').attr('value','').html('--Select One--');
		obj.append(opt);
		for (var i=0; i<data.length; ++i)
		{
			if (typeof(data[i]) != 'object')
				rec = { 'cd': i, 'descr': data[i] };
			else
				rec = data[i];
			var opt = $('<option></option>').attr('value',rec.cd).html(rec.descr);
			obj.append(opt);
		}
		//console.log(obj);
		return obj;
	},
	
	reload_lookups: function ( )
	{
		var params = 'action=wdb_init';
		$.ajax({
			url: 'wdb_init',
			type: 'get',
			data: params,
			dataType: 'json'
		}).done(function (data)
		{
			//console.log(data);
			wdb.group_data = data;
		});
	},

	get_lookup: function ( group, cd )
	{
		//debugger;
		var descr = '';
		for (var i=0; i<group.length; ++i)
		{
			var item = group[i];
			if (cd.trim() == item.cd.trim())
			{
				return item.descr;
			}
		}
		return 'n/a';
	},

	init: function ( )
	{
		$('#wdb_refresh_btn').button();
		$('#wdb_refresh_btn').on('click',wdb.buglist);
		$('#wdb_add_btn').button();
		$('#wdb_add_btn').on('click',wdb.bugadd);
		$('#wdb_admin_btn').button();
		$('#wdb_admin_btn').on('click',wdb.bugadmin);
		$('#wdb_help_btn').button();
		$('#wdb_help_btn').on('click',wdb.bughelp);
		$('#bugedit_form1').on('submit',wdb.bughandler);
		$('#wdb_form2').on('submit',wdb.workloghandler);
		$('#wdb_form9').on('submit',wdb.handle_search);
		$('#bug_email_form').on('submit',wdb.email_bug);
		$('#cancel2').on('click',wdb.worklogCancelDialog);
		$('#wdb_bug_edit_cancel').on('click',wdb.bugCancelDialog);
		$('#wdb_lu_form_id').on('submit',wdb.luhandler);
		$('#wdb_lu_save_cancel').on('click',wdb.lu_save_cancel);
		$('#wdb_user_form_id').on('submit',wdb.userhandler);
		$('#wdb_user_save_cancel').on('click',wdb.user_save_cancel);
		$('#wdb_show_buttons span').button();
		$('#wdb_admin_btn').show();
		var params = 'action=wdb_init';
		$.ajax({
			url: 'wdb_init',
			type: 'get',
			data: params,
			dataType: 'json'
		}).done(function (data)
		{
			//console.log(data);
			wdb.group_data = data;
			var sel = wdb.build_selection('wdb_group',data.wdb_group);
			$('#wdb_groups').empty().append(sel);
			var sel = wdb.build_selection('wdb_group',data.wdb_group);
			$('#wdb_grp').empty().append(sel);
			var sel = wdb.build_selection('bug_type',data.wdb_type);
			$('#btypes_s').empty().append(sel);
			var sel = wdb.build_selection('status',data.wdb_status);
			$('#status_s').empty().append(sel);
			var sel = wdb.build_selection('priority',data.wdb_priority);
			$('#priority_s').empty().append(sel);
			var sel = wdb.build_selection('bug_type2',data.wdb_type);
			$('#btc_types').empty().append(sel);
			var sel = wdb.build_selection('status2',data.wdb_status);
			$('#btc_status').empty().append(sel);
			if (!/admin/.test(wdb.group_data.roles)) $('#wdb_admin_btn').hide();
		});
	}

} // end of bt namespace

$(function ()
{
	$( document ).ajaxError(function(event, jqxhr, settings, thrownError) {
		wdb.showDialog( "ERROR!", "A error occurred during server call.<br>" + thrownError );
	});
	wdb.init();
	//login_content = $('#login_content').html();
	//$('#login_content').html('');
	//wdb.check_session();
});
