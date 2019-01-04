/**
 * Created by 13156 on 2018/10/22.
 */
const express=require('express');
const router=express.Router();
const bodyParser=require('body-parser');
const http=require('http');
const https=require('https');
const myUrl=require('url');
const querystring=require('querystring');
const multer=require('multer');
const common=require('../libs/common');
const cityJson=require('../libs/cityJson').cityJson;
const mysql=require('mysql');
const sql=mysql.createPool({
    limit:10,
    host:'localhost',
    user:'root',
    password:'0000',
    database:'menu'
});
const APPID='wx33daeafb99fad240';
const SECRET='f71a9d2e21860108840f20a7cea1f792';

//router.use(bodyParser.json()); // for parsing application/json
router.use(bodyParser.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded
//router.use(multer()); // for parsing multipart/form-data


/**
 * 用户登录
 */
router.get('/login',(req,res)=>{
    if ((req.url).indexOf('?')!=-1){
        let getData=myUrl.parse(req.url,true);
        let code=getData.query.code;
        let userInfo=JSON.parse(getData.query.userInfo);
        let sex=(userInfo.gender==1?'男':(userInfo.gender==2?'女':'未知'));
        let result='';
        let options={
            hostname:'api.weixin.qq.com',
            port:443,
            path:'/sns/jscode2session?appid='+APPID+'&secret='+SECRET+'&js_code='+code+'&grant_type=authorization_code',
            method:'GET'
        };
        https.request(options,(_res)=>{
            _res.on('data',(data)=>{
                result+=data;
            });
            _res.on('end',()=>{
                //res.status(200).send(result).end();
                result=JSON.parse(result);
                /*{
                    "session_key": "G9V9P/4lIo7hKt1eCUuivg==",
                    "openid": "oZmcn43sKsww0PIfen5VFj7KxHBI"
                }*/
                sql.query(`SELECT * FROM user WHERE openID='${result.openid}'`,(error,data)=>{
                    if (error){
                        console.error('数据库出错：',error);
                        res.status(500).send({success:false,msg:'数据库出错！',data:data}).end();
                    }else {
                        //console.log(data);
                        let _data=JSON.parse(JSON.stringify(data));
                        // console.log(JSON.stringify(data));
                        //console.log(_data);
                        let province=userInfo.province;
                        let city=userInfo.city;
                        for (let i=0;i<cityJson.length;i++){
                            if ((userInfo.province).toLowerCase()==cityJson[i].name_en){
                                province=cityJson[i].name;
                                for (let j=0;j<cityJson[i].city.length;j++){
                                    if ((userInfo.city).toLowerCase()==cityJson[i].city[j].county[0].name_en){
                                        city=cityJson[i].city[j].county[0].name;
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                        if (_data.length==0){
                            sql.query(`INSERT INTO user(openID,name,avatar_url,sex,country,province,city,date) VALUES('${result.openid}','${userInfo.nickName}'`
                                +`,'${userInfo.avatarUrl}','${sex}','${userInfo.country}','${province}','${city}','${common.getDate()}')`,(error)=>{
                                if (error){
                                    console.error('用户添加失败：',error);
                                    res.status(200).send({success:false,msg:'用户添加失败！'}).end();
                                }else {
                                    sql.query(`SELECT * FROM operate WHERE userID=(SELECT ID FROM user WHERE openID='${result.openid}')`,(err,data)=>{
                                        if (err){
                                            console.error(err);
                                        }
                                        sql.query(`SELECT * FROM user WHERE openID='${result.openid}'`,(error,data2)=> {
                                            if (error) {
                                                console.error('数据库出错：', error);
                                                //res.status(500).send({success: false, msg: '数据库出错！', data: data2}).end();
                                            }
                                            res.status(200).send({success:true,msg:'用户添加成功！',type:'new',data:{info:data2,operate:data}}).end();
                                        });

                                    });
                                    //res.status(200).send({success:true,msg:'用户添加成功！',type:'new'}).end();
                                }
                            })
                        }else {
                            sql.query(`SELECT * FROM operate WHERE userID=${_data[0].ID}`,(err,data)=>{
                                if (err){
                                    console.error(err);
                                }
                                res.status(200).send({success:true,msg:'登录成功！',type:'old',data:{info:_data,operate:data}}).end();
                            });
                        }
                    }
                });
            });
        }).on('error',(err)=>{
            console.error(err);
            res.status(400).send({success:false,msg:'登录失败！'}).end();
        }).end();
    }else {
        res.status(400).send({success:false,msg:'参数有错！'}).end();
    }
});

/**
 * 修改个人信息
 */
router.post('/updateinfo',(req,res)=>{
    let postData=req.body;
    let userID=postData.userID;
    //console.log(postData._updateData);
    let _update=JSON.parse(postData._updateData);
    let keys=Object.keys(_update);
    //let values=Object.values(_update);
    let str='';
    for(let i=0;i<keys.length;i++){
        str=str+keys[i]+"='"+_update[keys[i]]+"'"+(i==keys.length-1?"":",");
    }
    //console.log(`UPDATE user SET ${str} WHERE ID=${userID}`);
    sql.query(`UPDATE user SET ${str} WHERE ID=${userID}`,(error,data)=>{
        if (error){
            console.error(error);
            res.status(500).send({success:false,msg:'数据库出错！',data:data}).end();
        }else {
            res.status(200).send({success:true,msg:'修改信息成功！',data:data}).end();
        }
    })
});

/**
 * 获取用户收藏的菜品
 * param: userID
 */
router.get('/get_user_collect',(req,res)=>{
    if ((req.url).indexOf('?')!=-1){
        let getData=myUrl.parse(req.url,true).query;
        if (getData.userID!=null&&getData.userID!=''){
            let limit=getData.limit||0;
            let offset=getData.offset||20;
            // let collect=getUserCollect(getData.query.userID,getData.query.limit,getData.query.offset);
            sql.query(`SELECT * FROM operate WHERE userID=${getData.userID} AND operate='collection' LIMIT ${limit},${offset}`,(err,data)=>{
                if (err){
                    console.error(err);
                    res.status(500).send({success:false,msg:'获取用户收藏的菜品失败！',data:data}).end();
                }else {
                    res.status(200).send({success:true,msg:'获取用户收藏的菜品成功！',data:data}).end();
                }
            });
        }else {
            res.status(400).send({success:false,msg:'参数有错！'}).end();
        }
    }else {
        res.status(400).send({success:false,msg:'参数有错！'}).end();
    }
});

/**
 * 获取用户上传的菜品
 * param: userID
 */
router.get('/get_user_upload',(req,res)=>{
    if ((req.url).indexOf('?')!=-1){
        let getData=myUrl.parse(req.url,true).query;
        if (!!getData.userID){
            let limit=getData.limit||0;
            let offset=getData.offset||20;
            //let userUpload=getUserUpload(getData.query.userID,getData.query.limit,getData.query.offset);
            sql.query(`SELECT * FROM dish2 WHERE user_id=${getData.userID} LIMIT ${limit},${offset}`,(err,data)=>{
                if (err){
                    console.error(err);
                    res.status(500).send({success:false,msg:'获取用户上传的菜品失败！',data:data}).end();
                }else {
                    res.status(200).send({success:true,msg:'获取用户上传的菜品成功！',data:data}).end();
                }
            });
        }else {
            res.status(400).send({success:false,msg:'参数有错！'}).end();
        }
    }else {
        res.status(400).send({success:false,msg:'参数有错！'}).end();
    }
});

/**
 * 获取用户信息
 * param: userID
 */
router.get('/user_info',(req,res)=>{
    if ((req.url).indexOf('?')!=-1) {
        let getData = myUrl.parse(req.url, true).query;
        if (getData.userID != null && getData.userID != '') {
            //let userInfo=getUserInfo(getData.query.userID);
            sql.query(`SELECT * FROM user WHERE ID=${getData.userID}`,(err,data)=>{
                if (err){
                    console.error('获取用户信息失败！',err);
                }
                sql.query(`SELECT * FROM operate WHERE userID=${getData.userID}`,(err,data3)=>{
                    if (err){
                        console.error(err);
                    }
                    res.status(200).send({success:true,data:{userInfo:data,userOperate:data3}}).end();
                });
                /*sql.query(`SELECT * FROM history WHERE userID=${getData.userID}`,(err,data2)=>{
                    if (err){
                        console.error('获取用户历史信息失败！',err);
                    }

                })*/
            });
        }else {
            res.status(400).send({success:false,msg:'参数有错！'}).end();
        }
    }else {
        res.status(400).send({success:false,msg:'参数有错！'}).end();
    }
});

/**
 * 获取简单用户信息
 * param: userID
 */
router.get('/user_simpleinfo',(req,res)=>{
    if ((req.url).indexOf('?')!=-1) {
        let getData = myUrl.parse(req.url, true).query;
        if (getData.userID != null && getData.userID != '') {
            //let userInfo=getUserInfo(getData.query.userID);
            sql.query(`SELECT * FROM user WHERE ID=${getData.userID}`,(err,data)=>{
                if (err){
                    console.error('获取用户信息失败！',err);
                    res.status(500).send({success:false,msg:'获取简单用户信息失败！',data:data}).end();
                }else {
                    res.status(200).send({success:true,msg:'获取简单用户信息成功！',data:data}).end();
                }
            });
        }else {
            res.status(400).send({success:false,msg:'参数有错！'}).end();
        }
    }else {
        res.status(400).send({success:false,msg:'参数有错！'}).end();
    }
});

router.get('/user_operate',(req,res)=>{
    let getData = myUrl.parse(req.url, true).query;
    let userID=getData.user_id;
    if (userID){
        sql.query(`SELECT * FROM operate WHERE userID=${userID}`,(err,data)=>{
            if (err){
                console.error(err);
                res.status(500).send({success:false,msg:'查找用户操作失败!',data:data}).end();
            }else {
                res.status(200).send({success:true,msg:'查找用户操作成功!',data:data}).end();
            }
        })
    }else {
        res.status(400).send({success:false,msg:'user_id参数有误！'}).end();
    }
});

/**
 * 根据传过来的用户ID数组获取一组用户信息
 */
router.get('/userid_list',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let idList=getData.idList;
    if (idList && idList.indexOf('[')!=-1 && idList.indexOf(']')!=-1) {
        getListUserInfo(idList,function (obj) {
            res.status(200).send(obj).end();
        })
    }else{
        res.status(400).send({success:false,msg:'参数错误!'}).end();
    }
});

function getListUserInfo(idList, callback) {
    if (idList && idList.indexOf('[')!=-1 && idList.indexOf(']')!=-1) {
        idList = idList.substring(idList.indexOf('[') + 1, idList.indexOf(']'));
        idList = idList.replace(/'/g, "");//清除掉所有的字符串里面的引号
        idList = idList.split(',');
        for (let i=0;i<idList.length;i++){
            idList[i] = 'ID='+idList[i];
        }
        let str=idList.join(' OR ');
        let sqlstr=`SELECT * FROM user WHERE ${str}`;
        sql.query(sqlstr,(err,data)=>{
            if (err){
                console.error(err);
                callback({success:false,msg:'查找一组用户信息失败!',data:data});
                //res.status(500).send({success:false,msg:'查找一组用户信息失败!',data:data}).end();
            }else {
                callback({success:true,msg:'查找一组用户信息成功!',data:data});
                //res.status(200).send({success:true,msg:'查找一组用户信息成功!',data:data}).end();
            }
        })
    }
}

/*function getUserCollect(userID, limit=0, offset=20) {
    sql.query(`SELECT * FROM operate WHERE userID=${userID} AND operate='collect' LIMIT ${limit},${offset}`,(err,data)=>{
        if (err){
            console.error(err);
            return {success:false,msg:'获取用户收藏的菜品失败！',data:data};
        }else {
            console.log({success:true,msg:'获取用户收藏的菜品成功！',data:data});
            return {success:true,msg:'获取用户收藏的菜品成功！',data:data};
        }
    });
}

function getUserOperate(userID, limit=0, offset=20) {
    sql.query(`SELECT * FROM operate WHERE userID=${userID} LIMIT ${limit},${offset}`,(err,data)=>{
        if (err){
            console.error(err);
            return {success:false,msg:'获取用户菜品操作失败！',data:data};
        }else {
            return {success:true,msg:'获取用户菜品操作成功！',data:data};
        }
    });
}

function getUserUpload(userID,limit=0,offset=20) {
    sql.query(`SELECT * FROM dish2 WHERE user_id=${userID} LIMIT ${limit},${offset}`,(err,data)=>{
        if (err){
            console.error(err);
            return {success:false,msg:'获取用户上传的菜品失败！',data:data};
        }else {
            return {success:true,msg:'获取用户上传的菜品成功！',data:data};
        }
    });
}

function getUserHistory(userID) {
    sql.query(`SELECT * FROM history WHERE userID=${userID}`,(err,data)=>{
        if (err){
            console.error('获取用户历史信息失败！',err);
            return {success:false,msg:'获取用户历史信息失败！',data:data};
        }else {
            return {success:true,msg:'获取用户历史信息成功！',data:data};
        }
    })
}

function getUserInfo(userID) {
    sql.query(`SELECT * FROM user WHERE ID=${userID}`,(err,data)=>{
        if (err){
            console.error('获取用户信息失败！',err);
            return {success:false,msg:'获取用户信息失败！',data:data};
        }else {
            return {success:true,msg:'获取用户信息成功！',data:data};
        }
    })
}*/

module.exports=router;
