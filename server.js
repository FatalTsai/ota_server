global.Config = require('./config/config.json')
//global.winston = require('./winston')
global.Utility = require('./utility')
//multi part
var express = require('express');
var fs = require('fs');
var bodyParse = require('body-parser');
var morgan = require('morgan');
var path = require('path');


morgan.format('server', Config.morgan_format);
var api = express();
var router = express.Router();
var port = process.env.PORT || 1628;

//api.use(morgan('server', { stream: winston.stream }));
api.use(bodyParse.urlencoded({ extended: true }));
api.use(bodyParse.json());

router.use(function(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const method = req.method;
    console.log('request from' + ip, 'method[ ' + method + ']') ;
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Accept-Ranges','bytes')


    const stats = fs.statSync(__dirname + '/ota_files/' + req.body.file)
       
    res.header('Context-Length',stats.size)
    if (req.method === 'OPTIONS') {
        var headers = {};
        // IE8 does not allow domains to be specified, just the *
        // headers["Access-Control-Allow-Origin"] = req.headers.origin;
        headers["Access-Control-Allow-Origin"] = "*";
        headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
        headers["Access-Control-Allow-Credentials"] = false;
        headers["Access-Control-Max-Age"] = '86400'; // 24 hours
        headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
        
        res.writeHead(200, headers);
        res.end();
    } else {
        if (req.url === '/favicon.ico') {
            res.status(204);
        } else {
            next();
        }
    }
});

router.route('/ota')
    .get(function(req, res) {
        const ver = require('./ota_files/version.json');
        res.json(Utility.request_success(ver));
    })
    .post(function(req, res) {
        const file = req.body.file;
        console.log(req.body)
        //console.log(req.headers.range)


        const stats = fs.statSync(__dirname + '/ota_files/' + file)
        const range =readRangeHeader(req.headers.range,stats.size)




        console.log('Send: ' + path.join(__dirname + '/ota_files/' + file));
        if (fs.existsSync(path.join(__dirname + '/ota_files/' + file))) {

            
            console.log('start ='+range.Start+'     end ='+range.End)
            fs.createReadStream(__dirname + '/ota_files/' + file,{start :range.Start,end :range.End}).pipe(res)
            //res.sendFile(path.join(__dirname + '/ota_files/' + file));
        } else {
            res.json(Utility.request_failed("File not exits"));
        }
    });

function dirTree(filename) {
//    let filename = path.join(__dirname + '/ota_files/');
    //winston.info(filename)
    var stats = fs.lstatSync(filename),
        info = {
            path: filename,
            name: path.basename(filename)
        };

//    winston.info(stats);
    if (stats.isDirectory()) {
        info.type = "folder";
        info.children = fs.readdirSync(filename).map(function(child) {
            return dirTree(filename + '/' + child);
        });
    } else {
        // Assuming it's a file. In real life it could be a symlink or
        // something else!
        info.type = "file";
    }

    return info;
}


api.use('/', router);
api.listen(port);

function readRangeHeader(range,totalLength) {
    var array = String(range).split(/bytes=([0-9]*)-([0-9]*)/); //使用正規表示法 切割字串 array == ['',start,end,'']
    var start = parseInt(array[1]);
    var end = parseInt(array[2]);
   
    var result = {
        Start: isNaN(start) ? 0 : start,
        End: isNaN(end) ? (totalLength - 1) : end //如果request.header缺少start 或是 end（isNaN成立）  則將start ,end 設成檔案的頭跟尾

    };
   
    if (!isNaN(start) && isNaN(end)) {
        result.Start = start;
        result.End = totalLength - 1;
    }

    if (isNaN(start) && !isNaN(end)) {
        result.Start = totalLength - end;
        result.End = totalLength - 1;
    }
    
    return result;
    
}



