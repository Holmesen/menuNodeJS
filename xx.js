var path = require("path");
var fs = require("fs");
var express =require("express");
var app=express();
var bodyParser = require('body-parser');
const common=require('./libs/common');
const mysql=require('mysql');
const myUrl=require('url');
var formidable = require('formidable');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
//app.use(express.static("./images/upload"));
const sql=mysql.createPool({
    limit:10,
    host:'localhost',
    user:'root',
    password:'0000',
    database:'menu'
});
app.listen("3000",function () {
    console.log("服务启动")
});
//拦截请求
app.post("/image",function (req,res) {
    var form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.uploadDir = "C:/Users/13156/WebstormProjects/menuTest/images/upload";
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

/*app.post("/form",function (req,res) {
    let postData=req.body;
    console.log('postData:',req.body);
    //res.status(200).send('上传步骤成功！').end();
    sql.query(`INSERT INTO dish2(name,user_id,user_name,img_src,menu,cuisine,description,taste,ingredients,excipient,seasoning,practice,features,date,time1,time2,difficult,component)`
        +` VALUES('${postData.baseInfo.dishName}',3,'Holmesen','${postData.baseInfo.mainPic}','${postData.baseInfo.menu}','${postData.baseInfo.cuisine}','${postData.baseInfo.description}'`
        +`,'${postData.baseInfo.taste}','${JSON.stringify(postData.shicai.zhuliaoNameList)}','${JSON.stringify(postData.shicai.fuliaoNameList)}','${JSON.stringify(postData.shicai.tiaoliaoNameList)}'`
        +`,'${JSON.stringify(postData.step.step)}','${postData.baseInfo.features}','${common.getDate()}','${postData.baseInfo.cookingT}','${postData.baseInfo.prepareT}','${postData.baseInfo.difficult}','${postData.baseInfo.component}')`,(err,data)=>{
        if (err){
            console.error(err);
            res.status(500).send({success:false,msg:'插入数据库失败！',data:err}).end();
        }else {
            res.status(200).send({success:false,msg:'插入数据库成功！',data:data}).end();
        }
    })
});*/

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

app.use('/images',express.static('./images'));
