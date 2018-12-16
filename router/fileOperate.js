/**
 * Created by 13156 on 2018/12/11.
 */

const express =require("express");
//const server=express();
const router=express.Router();

var path = require("path");
var fs = require("fs");


var bodyParser = require('body-parser');
const common=require('../libs/common');
const mysql=require('mysql');
const myUrl=require('url');
var formidable = require('formidable');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));
//app.use(express.static("./images/upload"));
const sql=mysql.createPool({
    limit:10,
    host:'localhost',
    user:'root',
    password:'0000',
    database:'menu'
});
//拦截请求
router.post("/image",function (req,res) {
    var form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.uploadDir = "C:/Users/13156/WebstormProjects/menuTest/images";
    form.keepExtensions = true;//保留后缀
    form.maxFieldsSize = 5 * 1024 * 1024;
    //处理图片
    form.parse(req, function (err, fields, files){
        console.log(fields);
        console.log(files);
        /*var filename = files.xx.name;
        var nameArray = filename.split('.');
        var type = nameArray[nameArray.length - 1];
        var name = '';
        for (var i = 0; i < nameArray.length - 1; i++) {
            name = name + nameArray[i];
        }
        var date = new Date();
        var time = '_' + date.getFullYear() + "_" + (date.getMonth()+1) + "_" + date.getDate() + "_" + date.getHours() + "_" + date.getMinutes();
        var avatarName = name + time + '.' + type;
        var newPath = form.uploadDir + "/" + avatarName;
        fs.renameSync(files.xx.path, newPath);  //重命名
        res.status(200).send({data:"/upload/"+avatarName}).end();*/
    })
});

// app.use('/',(req,res)=>{
//     let getData=myUrl.parse(req.url,true).query;
//     sql.query(`SELECT taste FROM dish2 GROUP BY taste`,(err,data)=>{
//         if (err){
//             res.status(500).send(err).end();
//         }else {
//             res.status(200).send(data).end();
//         }
//     })
// });

router.use('/images',express.static('./images'));

/*// 微信小程序 图片上传
var multer  = require('multer');
var upload = multer({ dest: './images' });
router.use(upload.any());
// 图片上传
router.use('/image', upload.single('file'), function(req, res, next){
    // 文件路径
    console.log('req:',req);
    // var filePath = './' + req.file.path;
    // // 文件类型
    // var fileType = req.file.mimetype;
    // var lastName = '';
    // switch (fileType){
    //     case 'image/png':
    //         lastName = '.png';
    //         break;
    //     case 'image/jpeg':
    //         lastName = '.jpg';
    //         break;
    //     default:
    //         lastName = '.png';
    //         break;
    // }
    // // 构建图片名
    // var fileName = Date.now() + lastName;
    // // 图片重命名
    // fs.rename(filePath, fileName, (err) => {
    //     if (err) {
    //         res.end(JSON.stringify({status:'102',msg:'文件写入失败'}));
    //     }else{
    //         var localFile = './' + fileName;
    //         var formUploader = new qiniu.form_up.FormUploader(config);
    //         var putExtra = new qiniu.form_up.PutExtra();
    //         var key = fileName;
    //
    //         // 文件上传
    //         formUploader.putFile(uploadToken, key, localFile, putExtra, function(respErr,
    //                                                                              respBody, respInfo) {
    //             if (respErr) {
    //                 res.end(JSON.stringify({status:'101',msg:'上传失败',error:respErr}));
    //             }
    //             if (respInfo.statusCode == 200) {
    //                 var imageSrc = 'http://o9059a64b.bkt.clouddn.com/' + respBody.key;
    //                 res.end(JSON.stringify({status:'100',msg:'上传成功',imageUrl:imageSrc}));
    //             } else {
    //                 res.end(JSON.stringify({status:'102',msg:'上传失败',error:JSON.stringify(respBody)}));
    //             }
    //             // 上传之后删除本地文件
    //             fs.unlinkSync(localFile);
    //         });
    //     }
    // });
})*/

module.exports=router;