/**
 * Created by 13156 on 2018/10/22.
 */
const express=require('express');
const bodyParser=require('body-parser');
const expressStatic=require('express-static');
const fs=require('fs');
const common=require('./libs/common');
const mysql=require('mysql');
const multer=require('multer');
const path=require('path');
const formidable=require('formidable');
const http=require('http');
const https=require('https');

/*做https处理↓↓↓*/
const options = {
    key: fs.readFileSync('Nginx/2_www.holmesen.club.key'),
    cert: fs.readFileSync('Nginx/1_www.holmesen.club_bundle.crt')
};
var server=express();
/*var httpServer=http.createServer(server);
var httpsServer=https.createServer(options, server);
httpServer.listen(3000,function () {
    console.log('http server is running...');
});
httpsServer.listen(3001,function () {
    console.log('https server is running...');
});*/
/*做https处理↑↑↑*/

const _user=require('./router/user');
const _dish=require('./router/dish');
const _ingredients=require('./router/ingredients');
const _operate=require('./router/operate');
const _fileOperate=require('./router/fileOperate');

server.use(bodyParser.urlencoded({extended:true}));
server.use(bodyParser.json());
//var upload=multer({dest:'./images'});
//server.use(upload.any());

server.use('/images',express.static('./images'));
server.post("/upload_image",function (req,res) {
    var form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.uploadDir = "./images/upload";
    form.keepExtensions = true;//保留后缀
    form.maxFieldsSize = 5 * 1024 * 1024;
    //处理图片
    form.parse(req, function (err, fields, files){
        //console.log(fields);
        //console.log(files);
        switch (fields.type){
            case 'avatar': form.uploadDir = "./images/avatar"; break;
            case 'dish': form.uploadDir = "./images/dish"; break;
            case 'ingred': form.uploadDir = "./images/ingred"; break;
            case 'step': form.uploadDir = "./images/step"; break;
            default : form.uploadDir = "./images/upload";
        }
        var filename = files.xx.name;
        var nameArray = filename.split('.');
        var type = nameArray[nameArray.length - 1];
        var name = '';
        for (var i = 0; i < nameArray.length - 1; i++) {
            name = name + nameArray[i];
        }
        var date = new Date();
        var time = 'x' + date.getFullYear() + "_" + (date.getMonth()+1) + "_" + date.getDate() + "_" + date.getHours() + "_" + date.getMinutes();
        var avatarName = name + time + '.' + type;
        var newPath = form.uploadDir + "/" + avatarName;
        fs.renameSync(files.xx.path, newPath);  //重命名
        res.status(200).send({data:"/images/"+fields.type+"/"+avatarName}).end();
    })
});

server.use('/user',_user);
server.use('/dish',_dish);
server.use('/ingredients',_ingredients);
server.use('/operate',_operate);
server.use('/fileoperate',_fileOperate);

server.listen(3000);