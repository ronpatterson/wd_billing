// WD Billing - nodejs server module
// Ron Patterson, BPWC
// 10/4/2016

'use strict';

// load required modules
const express = require('express'),
	app = express(),
	MongoClient = require('mongodb').MongoClient,
	engines = require('consolidate'),
	bodyParser = require('body-parser'),
	path = require("path"),
	assert = require('assert'),
	WD_Billing = require('./wd_billing'),
	wdb = new WD_Billing();

// globals
const mongo_host = 
		'localhost',
//		'192.168.0.25',
	mongo_port = '27017';

// setup express.js
app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true })); 
console.log('Current directory: ',process.cwd());

function app_init (db) {
	// load lookups with the bt_lookups and bt_users collections
	var cursor = db.collection('wdb_lookups').find( { } );
	var results = {};
	cursor.forEach((doc) => {
		//assert.equal(null, doc);
		var arr = [];
		var id = doc._id;
		doc.items.forEach((element, index, array) => {
			if (element.active == "y")
				arr.push({"cd":element.cd,"descr":element.descr});
		});
		results[id] = arr;
	}, (err) => {
		assert.equal(null, err);
		results.roles = "admin";
		results.users = {};
		// get users for lookups
		var cursor = db.collection('wdb_users').find( { } );
		cursor.forEach((doc) => {
			//console.log(doc);
			doc.name = doc.lname + ', ' + doc.fname;
			results.users[doc.uid] = doc;
		}, (err) => {
			assert.equal(null, err);
			//console.log(results);
			wdb.put_lookups(results);
		});
	});
}

MongoClient.connect('mongodb://'+mongo_host+':'+mongo_port+'/wd_billing', (err, db) => {

	assert.equal(null, err);
	console.log("Successfully connected to MongoDB.");
	app_init(db);
	//debugger;
	setInterval(function() {app_init(db)},60000); // refresh lookups

	app.get('/', function(req, res, next) {
		res.render('wd_billing');
	});

	app.get('/wdb_init', function(req, res) {
		app_init(db, req, res);
		res.json(wdb.get_lookups());
		res.end();
		//console.log('Lookups loaded');
	});

	app.get('/bugList', function(req, res) {
		wdb.bugList(db, req, res);
	});

	app.get('/wdb_proj_list', function(req, res) {
		wdb.proj_list(db, req, res);
	});

	app.get('/wdb_get_proj', function(req, res) {
		wdb.get_proj(db, req, res);
	});
	
	app.post('/wdb_add_update_proj', function(req, res, next) {
		wdb.add_update_proj(db, req, res, next);
	});

	app.post('/wdb_delete_proj', function(req, res) {
		wdb.delete_proj(db, req, res);
	});

	app.post('/worklog_add', function(req, res, next) {
		wdb.worklog_add(db, req, res, next);
	});

	app.post('/worklog_updateX', function(req, res, next) {
		wdb.worklog_updateX(db, req, res, next);
	});

	app.post('/assign_user', function(req, res, next) {
		wdb.assign_user(db, req, res, next);
	});

	app.post('/wdb_email', function(req, res, next) {
		wdb.wdb_email(db, req, res, next);
	});

	//app.post('/attachment_add', upload.single('upfile'), function(req, res, next) {
	app.post('/attachment_add', (req, res, next) => {
		wdb.attachment_add(db, req, res, next);
	});

	app.post('/attachment_delete', function(req, res) {
		wdb.attachment_delete(db, req, res);
	});

	app.get('/admin_lu_list', function(req, res) {
		wdb.admin_lu_list(db, req, res);
	});

	app.get('/admin_lu_get', function(req, res) {
		wdb.admin_lu_get(db, req, res);
	});

	app.post('/lu_add_update', function(req, res, next) {
		wdb.lu_add_update(db, req, res, next);
	});

	app.get('/admin_users', function(req, res) {
		wdb.admin_users(db, req, res);
	});

	app.get('/user_get', function(req, res) {
		wdb.user_get(db, req, res);
	});

	app.post('/user_add_update', function(req, res, next) {
		wdb.user_add_update(db, req, res, next);
	});

	app.use(wdb.errorHandler);

	var server = app.listen(3000, function() {
		var port = server.address().port;
		console.log('Express server listening on port %s.', port);
	});

}); // MongoClient.connect
