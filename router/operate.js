/**
 * Created by 13156 on 2018/12/4.
 */
const express=require('express');
const router=express.Router();
const bodyParser=require('body-parser');
const http=require('http');
const https=require('https');
const myUrl=require('url');
const querystring=require('querystring');
const cheerio=require('cheerio');
const common=require('../libs/common');
const mysql=require('mysql');
const sql=mysql.createPool({
    limit:10,
    host:'localhost',
    user:'root',
    password:'0000',
    database:'menu'
});

router.use(bodyParser.urlencoded({extend:false}));

router.get('/operate',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let userID=getData.userID;
    let type=getData.type||'';
    let str='';
    if (userID && userID!=''){
        if (type!=''){
            str=`SELECT * FROM operate WHERE userID=${userID} AND operate='${type}'`;
        }else {
            str=`SELECT * FROM operate WHERE userID=${userID}`;
        }
        sql.query(str,(err,data)=>{
            if (err){
                console.error(err);
                res.status(500).send({success:false,msg:'查找用户操作失败!',data:data}).end();
            }else {
                res.status(200).send({success:true,msg:'查找用户操作成功!',data:data}).end();
            }
        })
    }else {
        res.status(400).send({success:false,msg:'userID参数错误!'}).end();
    }

});

router.get('/add_history',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let userID=getData.userID;
    let key=getData.key;
    sql.query(`INSERT INTO operate(userID,operate,_key,date) VALUES(${userID},'history','${key}','${common.getDate()}')`,err=>{
        if (err){
            console.error(err);
            res.status(500).send({success:false,msg:'添加搜索历史失败!'}).end();
        }else {
            res.status(200).send({success:true,msg:'添加搜索历史成功!'}).end();
        }
    })
});

router.get('/get_history',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let userID=getData.userID;
    sql.query(`SELECT * FROM operate WHERE userID=${userID} AND operate='history'`,(err,data)=>{
        if (err){
            console.error(err);
            res.status(500).send({success:false,msg:'查找搜索历史失败!'}).end();
        }else {
            res.status(200).send({success:true,msg:'查找搜索历史成功!',data:data}).end();
        }
    })
});

router.get('/clear_history',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let userID=getData.userID;
    sql.query(`DELETE FROM operate WHERE userID=${userID} AND operate='history'`,(err)=>{
        if (err){
            console.error(err);
            res.status(500).send({success:false,msg:'清除搜索历史失败!'}).end();
        }else {
            res.status(200).send({success:true,msg:'清除搜索历史成功!'}).end();
        }
    })
});

/**
 * 收藏菜品
 * param:userID,dishID,dishName
 */
router.get('/collect_dish',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let dishID=getData.dishID;
    let userID=getData.userID;
    let avatarID=getData.avatarID;
    let date=common.getDate();
    sql.query(`UPDATE dish2 SET collection=collection+1 WHERE ID=${dishID}`,err=>{
        if (err){
            console.error(err);
            res.status(500).send({success:false,msg:'菜品点收藏失败!'}).end();
        }else {
            sql.query(`INSERT INTO operate(userID,dishID,avatarID,operate,date) VALUES(${userID},${dishID},${avatarID},'collection','${date}')`,err=>{
                if (err){
                    console.error(err);
                    res.status(500).send({success:false,msg:'菜品添加收藏失败!'}).end();
                }else {
                    res.status(200).send({success:true,msg:'菜品添加收藏成功!'}).end();
                }
            });
        }
    })
    // let postData=req.body;
    // if (postData.userID!=null&&postData.userID!=''){
    //     sql.query(`SELECT COUNT(*) FROM collection WHERE user_ID=${postData.userID} AND dish_ID=${postData.dishID}`,(err,data)=>{
    //         if (err){
    //             console.error(err);
    //             res.status(500).end();
    //         }else {
    //             if (data[0]['COUNT(*)']>0){
    //                 res.status(400).send('已经有收藏过该菜品！').end();
    //             }else {
    //                 sql.query(`INSERT INTO collection(user_ID,dish_ID,dish_Name,date) VALUES`
    //                     +`(${postData.userID},${postData.dishID},'${postData.dishName}','${common.getDate()}')`,error=>{
    //                     if (error){
    //                         console.error(error);
    //                         res.status(500).send('菜品收藏失败！').end();
    //                     }else {
    //                         res.status(200).send('菜品收藏成功！').end();
    //                     }
    //                 })
    //             }
    //         }
    //     });
    // }else {
    //     res.status(500).send('用户有问题！').end();
    // }
});

/**
 * 取消收藏操作
 */
router.get('/un_collect_dish',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let dishID=getData.dishID;
    sql.query(`UPDATE dish2 SET collection=collection-1 WHERE ID=${dishID}`,err=>{
        if (err){
            console.error(err);
            res.status(500).send({success:false,msg:'菜品取消收藏失败!'}).end();
        }else {
            sql.query(`DELETE FROM operate WHERE dishID=${dishID} AND operate='collection'`,err=>{
                if (err){
                    console.error(err);
                    res.status(500).send({success:false,msg:'菜品取消收藏失败!'}).end();
                }else {
                    res.status(200).send({success:true,msg:'菜品取消收藏成功!'}).end();
                }
            });
        }
    })
});

/**
 * 点赞操作
 */
router.get('/like',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let dishID=getData.dishID;
    let userID=getData.userID;
    let avatarID=getData.avatarID;
    let flag=getData.flag;
    let date=common.getDate();
    if (flag=='false'){
        console.log('点赞');
        sql.query(`UPDATE dish2 SET _like=_like+1 WHERE ID=${dishID}`,err=>{
            if (err){
                console.error(err);
                res.status(500).send({success:false,msg:'菜品点赞失败!'}).end();
            }else {
                sql.query(`INSERT INTO operate(userID,dishID,avatarID,operate,date) VALUES(${userID},${dishID},${avatarID},'like','${date}')`,err=>{
                    if (err){
                        console.error(err);
                        res.status(500).send({success:false,msg:'菜品添加赞失败!'}).end();
                    }else {
                        res.status(200).send({success:true,msg:'菜品添加赞成功!'}).end();
                    }
                });
            }
        })
    }else {
        console.log('取消点赞');
        sql.query(`UPDATE dish2 SET _like=_like-1 WHERE ID=${dishID}`,err=>{
            if (err){
                console.error(err);
                res.status(500).send({success:false,msg:'菜品取消赞失败!'}).end();
            }else {
                sql.query(`DELETE FROM operate WHERE dishID=${dishID} AND operate='like'`,err=>{
                    if (err){
                        console.error(err);
                        res.status(500).send({success:false,msg:'菜品取消赞失败!'}).end();
                    }else {
                        res.status(200).send({success:true,msg:'菜品取消赞成功!'}).end();
                    }
                });
            }
        })
    }
});

/**
 * 点踩操作
 */
router.get('/unlike',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let dishID=getData.dishID;
    let userID=getData.userID;
    let avatarID=getData.avatarID;
    let flag=getData.flag;
    let date=common.getDate();
    if (flag=='false'){
        console.log('点踩');
        sql.query(`UPDATE dish2 SET unlike=unlike+1 WHERE ID=${dishID}`,err=>{
            if (err){
                console.error(err);
                res.status(500).send({success:false,msg:'菜品点踩失败!'}).end();
            }else {
                sql.query(`INSERT INTO operate(userID,dishID,avatarID,operate,date) VALUES(${userID},${dishID},${avatarID},'unlike','${date}')`,err=>{
                    if (err){
                        console.error(err);
                        res.status(500).send({success:false,msg:'菜品添加踩失败!'}).end();
                    }else {
                        res.status(200).send({success:true,msg:'菜品添加踩成功!'}).end();
                    }
                });
            }
        })
    }else {
        console.log('取消点踩');
        sql.query(`UPDATE dish2 SET unlike=unlike-1 WHERE ID=${dishID}`,err=>{
            if (err){
                console.error(err);
                res.status(500).send({success:false,msg:'菜品取消踩失败!'}).end();
            }else {
                sql.query(`DELETE FROM operate WHERE dishID=${dishID} AND operate='unlike'`,err=>{
                    if (err){
                        console.error(err);
                        res.status(500).send({success:false,msg:'菜品取消踩失败!'}).end();
                    }else {
                        res.status(200).send({success:true,msg:'菜品取消踩成功!'}).end();
                    }
                });
            }
        })
    }
});

module.exports=router;