/**
 * Created by 13156 on 2018/10/23.
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
const reptile=require('../libs/reptile');
const mysql=require('mysql');
const sql=mysql.createPool({
    limit:10,
    host:'localhost',
    user:'root',
    password:'0000',
    database:'menu'
});

router.use(bodyParser.urlencoded({extend:false}));

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
    // let postData=req.body;
    // if (postData.userID!=''&&postData.dishID!=''){
    //     sql.query(`DELETE FROM collection WHERE user_ID=${postData.userID} AND dish_ID=${postData.dishID}`,err=>{
    //         if (err){
    //             res.status(500).send('取消收藏失败！').end();
    //         }else {
    //             res.status(200).send('取消收藏成功！').end();
    //         }
    //     })
    // }else {
    //     res.status(400).send('所传参数有误！').end();
    // }
});

/**
 * 获取菜品信息
 */
router.get('/dish_info',(req,res)=>{
    if ((req.url).indexOf('?')!=-1){
        let getData=myUrl.parse(req.url,true);
        if(getData.query.dishID||getData.query.dishID==null||getData.query.dishID==''){
            res.status(400).send('菜品ID不正确!').end();
        }else {
            sql.query(`SELECT * FROM dish2 WHERE ID=${getData.query.dishID}`,(err,data)=>{
                if (err){
                    console.error('查找菜品出错！',err);
                    res.status(500).send({success:false,msg:'查找菜品出错!',data:data}).end();
                }else {
                    addView(getData.query.dishID);
                    // console.log(data[0].user_id);
                    sql.query(`SELECT name,avatar_url FROM user WHERE ID=${data[0].user_id}`,(err,data2)=>{
                        if (err){
                            console.error(err);
                        }
                        res.status(200).send({success:true,msg:'查找到菜品!',data:data,avatar:data2}).end();
                    })
                }
            })
        }

    }else {
        res.status(400).send('所传参数有错!').end();
    }
});

/**
 * 查找菜品类别
 */
router.get('/category',(req,res)=>{
    //let getData=myUrl.parse(req.url,true);
    sql.query(`SELECT menu FROM dish2 GROUP BY menu`,(err,data)=>{
        if (err){
            console.error('查找菜品类别出错！',err);
            res.status(500).send({success:false,msg:'查找菜品类别失败!',data:data}).end();
        }else {
            res.status(200).send({success:true,msg:'查找菜品类别成功!',data:data}).end();
        }
    })
});

/**
 * 查找菜品子类别
 */
router.get('/subcategory',(req,res)=>{
    let getData=myUrl.parse(req.url,true).query;
    let menu=getData.category;
    let sqlstr='';
    if (menu){
        sqlstr=`SELECT cuisine FROM dish2 WHERE menu='${menu}' GROUP BY cuisine`;
    }else {
        sqlstr=`SELECT menu,cuisine FROM dish2 GROUP BY cuisine`;
    }
    sql.query(sqlstr,(err,data)=>{
        if (err){
            console.error('查找菜品子类别出错！',err);
            res.status(500).send({success:false,msg:'查找菜品子类别失败!',data:data}).end();
        }else {
            res.status(200).send({success:true,msg:'查找菜品子类别成功!',data:data}).end();
        }
    })
});

/**
 * 搜索类别菜品
 */
router.get('/search_category',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let cate=getData.category;
    let limit=getData.limit || 0;
    let offset=getData.offset || 20;
    sql.query(`SELECT * FROM dish2 WHERE menu='${cate}' LIMIT ${limit},${offset}`,(err,data)=>{
        if (err){
            console.error(err);
            res.status(500).send({success:false,msg:'查找类别菜品失败!',data:data}).end();
        }else {
            res.status(200).send({success:true,msg:'查找类别菜品成功!',data:data}).end();
        }
    })
});

/**
 * 搜索子类别菜品
 */
router.get('/search_subcategory',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let subCate=getData.subcategory;
    let limit=getData.limit || 0;
    let offset=getData.offset || 20;
    sql.query(`SELECT * FROM dish2 WHERE cuisine='${subCate}' LIMIT ${limit},${offset}`,(err,data)=>{
        if (err){
            console.error(err);
            res.status(500).send({success:false,msg:'查找子类别菜品失败!',data:data}).end();
        }else {
            res.status(200).send({success:true,msg:'查找子类别菜品成功!',data:data}).end();
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

/**
 * 获取名字相似菜品
 */
router.get('/dish_like',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let limit=getData.limit||0;
    let offset=getData.offset||20;
    sql.query(`SELECT * FROM dish2 WHERE name LIKE '%${getData.key}%' LIMIT ${limit},${offset}`,(err,data)=>{
        if (err){
            console.error(err);
            res.status(500).send({success:false,msg:'查找相似菜品失败!',data:data}).end();
        }else {
            res.status(200).send({success:true,msg:'查找相似菜品成功!',data:data}).end();
        }
    })
});

/**
 * 获取同类型菜品
 */
router.get('/same_menu_cuisine',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let menu=getData.menu;
    let cuisine=getData.cuisine;
    let limit=getData.limit||0;
    let offset=getData.offset||20;
    let sqlstr='';
    if (cuisine)
        sqlstr=`SELECT * FROM dish2 WHERE cuisine='${cuisine}' LIMIT ${limit},${offset}`;
    else if (menu)
        sqlstr=`SELECT * FROM dish2 WHERE menu='${menu}' LIMIT ${limit},${offset}`;
        else res.status(400).send({success:false,msg:'所传参数不对!'}).end();
    sql.query(sqlstr,(err,data)=>{
        if (err){
            console.error(err);
            res.status(500).send({success:false,msg:'查找同类别菜品失败!',data:data}).end();
        }else {
            res.status(200).send({success:true,msg:'查找同类别菜品成功!',data:data}).end();
        }
    })
});

/**
 * 查找随机菜品
 */
router.get('/rand_dish',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let menu=getData.menu;
    let cuisine=getData.cuisine;
    let offset=getData.offset||20;
    let sqlstr='';
    if (cuisine)
        sqlstr=`SELECT * FROM dish2 WHERE cuisine='${cuisine}' AND ID >= (SELECT floor(RAND() * 
    ((SELECT MAX(ID) FROM dish2 WHERE cuisine='${cuisine}') - (SELECT MIN(ID) FROM dish2 WHERE cuisine='${cuisine}')) + 
    (SELECT MIN(ID) FROM dish2 WHERE cuisine='${cuisine}'))) ORDER BY ID LIMIT ${offset}`;
    else{
        if (menu)
            sqlstr=`SELECT * FROM dish2 WHERE menu='${menu}' AND ID >= (SELECT floor(RAND() * 
    ((SELECT MAX(ID) FROM dish2 WHERE menu='${menu}') - (SELECT MIN(ID) FROM dish2 WHERE menu='${menu}')) + 
    (SELECT MIN(ID) FROM dish2 WHERE menu='${menu}'))) ORDER BY ID LIMIT ${offset}`;
        else
            sqlstr=`SELECT * FROM dish2 WHERE ID >= (SELECT floor(RAND() * 
    ((SELECT MAX(ID) FROM dish2) - (SELECT MIN(ID) FROM dish2)) + 
    (SELECT MIN(ID) FROM dish2))) ORDER BY ID LIMIT ${offset}`;
            //res.status(400).send({success:false,msg:'所传参数不对!'}).end();
    }
    sql.query(sqlstr,(err,data)=>{
        if (err){
            console.error(err);
            res.status(500).send({success:false,msg:'查找随机菜品失败!',data:data}).end();
        }else {
            res.status(200).send({success:true,msg:'查找随机菜品成功!',data:data}).end();
        }
    })
});

/**
 * 根据食材查找菜品
 */
router.post('/ingred2dish',(req,res)=>{
    let postData=req.body;
    let shicai=postData.shicai;
    if (shicai && shicai.indexOf('[')!=-1 && shicai.indexOf(']')!=-1){
        shicai=shicai.substring(shicai.indexOf('[')+1,shicai.indexOf(']'));
        shicai=shicai.replace(/'/g,"");//清除掉所有的字符串里面的引号
        shicai=shicai.split(',');
        let zstr='';
        let fstr='';
        let tstr='';
        for(let i=0; i<shicai.length; i++){
            zstr += `ingredients LIKE '%${shicai[i]}%'`;
            fstr += `excipient LIKE '%${shicai[i]}%'`;
            tstr += `seasoning LIKE '%${shicai[i]}%'`;
            if (i<shicai.length-1){
                zstr += ' AND ';
                fstr += ' AND ';
                tstr += ' AND ';
            }
        }
        let sqlstr=`SELECT * FROM dish2 WHERE (${zstr}) OR (${fstr}) OR (${tstr})`;
        console.log(sqlstr);
        sql.query(sqlstr,(err,data)=>{
            if (err){
                console.error(err);
                res.status(500).send({success:false,msg:'根据食材查找菜品失败!',data:data}).end();
            }else {
                res.status(200).send({success:true,msg:'根据食材查找菜品成功!',data:data}).end();
            }
        });
    }else {
        res.status(500).send({success:false,msg:'shicai参数错误!'}).end();
    }
    /*if (req.url.indexOf('?')!=-1) {
        let getData = (myUrl.parse(req.url, true)).query;
        if (getData.ingred && (getData.ingred).indexOf('[')!=-1 && (getData.ingred).indexOf(']')!=-1) {
            getData.ingred=getData.ingred.substring(getData.ingred.indexOf('[')+1,getData.ingred.indexOf(']'));
            console.log(getData.ingred);
            let arr=getData.ingred.split(',');
            let sqlstr=`SELECT * FROM dish2 WHERE (ingredients LIKE '%油%' AND ingredients LIKE '%面%') OR
             (excipient LIKE '%油%' AND excipient LIKE '%面%') OR (seasoning LIKE '%油%' AND seasoning LIKE '%面%')`;
        }else {
            res.status(500).send({success:false,msg:'ingred参数错误!'}).end();
        }
    }else {
        res.status(500).send({success:false,msg:'参数错误!'}).end();
    }*/
});

/**
 * 获取同口味菜品
 */
router.get('/same_taste',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let taste=getData.taste;
    let limit=getData.limit||0;
    let offset=getData.offset||20;
    if (taste){
        let sqlstr=`SELECT * FROM dish2 WHERE taste='${taste}' LIMIT ${limit},${offset}`;
        sql.query(sqlstr,(err,data)=>{
            if (err){
                console.error(err);
                res.status(500).send({success:false,msg:'查找同口味菜品失败!',data:data}).end();
            }else {
                res.status(200).send({success:true,msg:'查找同口味菜品成功!',data:data}).end();
            }
        })
    }else{
        res.status(400).send({success:false,msg:'参数错误!'}).end();
    }
});

/**
 * 获取同烹饪方法菜品
 */
router.get('/same_process',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let process=getData.process;
    let limit=getData.limit||0;
    let offset=getData.offset||20;
    if (taste){
        let sqlstr=`SELECT * FROM dish2 WHERE process='${process}' LIMIT ${limit},${offset}`;
        sql.query(sqlstr,(err,data)=>{
            if (err){
                console.error(err);
                res.status(500).send({success:false,msg:'查找同烹饪手法菜品失败!',data:data}).end();
            }else {
                res.status(200).send({success:true,msg:'查找同烹饪手法菜品成功!',data:data}).end();
            }
        })
    }else{
        res.status(400).send({success:false,msg:'参数错误!'}).end();
    }
});

/**
 * 根据传过来的菜品ID数组获取一组菜品
 */
router.get('/dishid_list',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let idList=getData.idList;
    let str='';
    if (idList && idList.indexOf('[')!=-1 && idList.indexOf(']')!=-1) {
        idList = idList.substring(idList.indexOf('[') + 1, idList.indexOf(']'));
        idList = idList.replace(/'/g, "");//清除掉所有的字符串里面的引号
        idList = idList.split(',');
        for (let i=0;i<idList.length;i++){
            idList[i] = 'ID='+idList[i];
        }
        str=idList.join(' OR ');
        let sqlstr=`SELECT * FROM dish2 WHERE ${str}`;
        sql.query(sqlstr,(err,data)=>{
            if (err){
                console.error(err);
                res.status(500).send({success:false,msg:'查找一组菜品失败!',data:data}).end();
            }else {
                res.status(200).send({success:true,msg:'查找一组菜品成功!',data:data}).end();
            }
        })
    }else{
        res.status(400).send({success:false,msg:'参数错误!'}).end();
    }
});

router.post("/upload_dish",function (req,res) {
    let postData=req.body;
    //console.log('postData:',req.body);
    postData.baseInfo.features=(postData.baseInfo.features).replace(/，/g, ",");
    //res.status(200).send('上传步骤成功！').end();
    sql.query(`INSERT INTO dish2(name,user_id,user_name,img_src,menu,cuisine,description,taste,process,
    ingredients,excipient,seasoning,practice,features,date,time1,time2,difficult,component)
     VALUES('${postData.baseInfo.dishName}',${postData.user.id},'${postData.user.name}','${postData.baseInfo.mainPic}',
     '${postData.baseInfo.menu}','${postData.baseInfo.cuisine}','${postData.baseInfo.description}'
     ,'${postData.baseInfo.taste}','${postData.baseInfo.process}','${JSON.stringify(postData.shicai.zhuliaoNameList)}'
     ,'${JSON.stringify(postData.shicai.fuliaoNameList)}','${JSON.stringify(postData.shicai.tiaoliaoNameList)}'
     ,'${JSON.stringify(postData.step.step)}','${postData.baseInfo.features}','${common.getDate()}'
     ,'${postData.baseInfo.cookingT}','${postData.baseInfo.prepareT}','${postData.baseInfo.difficult}'
     ,'${postData.baseInfo.component}')`,(err,data)=>{
        if (err){
            console.error(err);
            res.status(500).send({success:false,msg:'插入数据库失败！',data:err}).end();
        }else {
            res.status(200).send({success:true,msg:'插入数据库成功！',data:data}).end();
        }
    })
});

/**
 * 爬取每日三餐
 */
function reptileMeals() {
    https.get('https://www.meishij.net/',function (resualt) {
        let html='';
        resualt.on('data',chunk=>{
            html+=chunk;
        });
        resualt.on('end',()=>{
            if (html){
                let $=cheerio.load(html);
                if ($('#index_zzw_main')){
                    let meals=$('#index_zzw_main');
                    let mealObj=[];
                    meals.find('div').each(function (item) {
                        let mealList=$(this);
                        switch (mealList.attr('c')){
                            case '1':
                                mealList.find('ul').first().find('li').each(function (item) {
                                    let meal=$(this);
                                    let obj={
                                        menu:'每日三餐',
                                        cuisine:'早餐',
                                        name:meal.find('a').first().attr('title'),
                                        href:meal.find('a').first().attr('href'),
                                        imgSrc:meal.find('a').first().find('img').first().attr('src'),
                                        text:meal.find('div').first().find('strong').first().text(),
                                        features:meal.find('div').first().find('span').first().find('a').first().text()
                                    };
                                    if (obj){
                                        mealObj.push(obj);
                                    }
                                });
                                break;
                            case '2':
                                mealList.find('ul').first().find('li').each(function (item) {
                                    let meal=$(this);
                                    let obj={
                                        menu:'每日三餐',
                                        cuisine:'午餐',
                                        name:meal.find('a').first().attr('title'),
                                        href:meal.find('a').first().attr('href'),
                                        imgSrc:meal.find('a').first().find('img').first().attr('src'),
                                        text:meal.find('div').first().find('strong').first().text(),
                                        features:meal.find('div').first().find('span').first().find('a').first().text()
                                    };
                                    if (obj){
                                        mealObj.push(obj);
                                    }
                                });
                                break;
                            case '3':
                                mealList.find('ul').first().find('li').each(function (item) {
                                    let meal=$(this);
                                    let obj={
                                        menu:'每日三餐',
                                        cuisine:'下午茶',
                                        name:meal.find('a').first().attr('title'),
                                        href:meal.find('a').first().attr('href'),
                                        imgSrc:meal.find('a').first().find('img').first().attr('src'),
                                        text:meal.find('div').first().find('strong').first().text(),
                                        features:meal.find('div').first().find('span').first().find('a').first().text()
                                    };
                                    if (obj){
                                        mealObj.push(obj);
                                    }
                                });
                                break;
                            case '4':
                                mealList.find('ul').first().find('li').each(function (item) {
                                    let meal=$(this);
                                    let obj={
                                        menu:'每日三餐',
                                        cuisine:'晚餐',
                                        name:meal.find('a').first().attr('title'),
                                        href:meal.find('a').first().attr('href'),
                                        imgSrc:meal.find('a').first().find('img').first().attr('src'),
                                        text:meal.find('div').first().find('strong').first().text(),
                                        features:meal.find('div').first().find('span').first().find('a').first().text()
                                    };
                                    if(obj){
                                        mealObj.push(obj);
                                    }
                                });
                                break;
                            case '5':
                                mealList.find('ul').first().find('li').each(function (item) {
                                    let meal=$(this);
                                    let obj={
                                        menu:'每日三餐',
                                        cuisine:'夜宵',
                                        name:meal.find('a').first().attr('title'),
                                        href:meal.find('a').first().attr('href'),
                                        imgSrc:meal.find('a').first().find('img').first().attr('src'),
                                        text:meal.find('div').first().find('strong').first().text(),
                                        features:meal.find('div').first().find('span').first().find('a').first().text()
                                    };
                                    //console.log('夜宵-'+item,obj);
                                    if (obj){
                                        mealObj.push(obj);
                                    }
                                });
                                break;
                        }
                    });
                    reptile.gotoDish(mealObj)
                }else {
                    console.log('没有#index_zzw_main');
                }
            }else {
                console.log('html为空');
            }
        })
    }).on('error',function (err) {
        console.error(err);
    });
}

/**
 * 爬取每天的最新、最热、热门、本周最热菜品
 * @param path
 * @param menu
 */
function reptileDayDish(path,menu) {
    let options={
        hostname: 'www.meishij.net',
        port: 443,
        path: path,
        method: 'GET',
        headers:{
            'Referer': 'https://www.meishij.net/'
        }
    };
    https.get(options,function (resualt) {
        let html='';
        resualt.on('data',chunk=>{
            html+=chunk;
        });
        resualt.on('end',()=>{
            if (html){
                let $=cheerio.load(html);
                if ($('#listtyle1_w')) {
                    let dishs = $('#listtyle1_w');
                    let dishObj = [];
                    dishs.find('#listtyle1_list').children('div').each(function (item) {
                        let dish=$(this);
                        let href=dish.find('a').first().attr('href');
                        let name=dish.find('a').first().attr('title');
                        let imgSrc=dish.find('a').children('img').first().attr('src');
                        if (name && imgSrc && href.indexOf('http')!=-1){
                            dishObj.push({
                                name:name,
                                imgSrc:imgSrc,
                                href:href,
                                menu:menu,
                                cuisine:menu
                            })
                        }
                    });
                    //console.log(dishObj);
                    reptile.gotoDish(dishObj)
                }
            }
        })
    })
}

/**
 * 获取每日三餐（每天原网站爬取一次）
 */
router.get('/meals',(req,res)=>{
    let nowDate=common.getDate('date');
    sql.query(`SELECT * FROM dish2 WHERE menu='每日三餐' AND date LIKE '%${nowDate}%'`,(err,data)=>{
        if (err){
            console.error(err);
        }
        if (data.length>0){
            res.status(200).send({success:true,msg:'从数据库获取当天每日三餐菜品成功!',data:data}).end();
        }else {
            sql.query(`SELECT * FROM dish2 WHERE menu='每日三餐' AND date LIKE '%${common.splitDate(common.preDate('day',1),'date')}%'`,(err,data2)=>{
                if (err){
                    console.error(err);
                }
                res.status(200).send({success:true,msg:'从数据库获取昨天每日三餐菜品成功!',data:data2}).end();
            });
            reptileMeals();
        }
    });

});

/**
 * 获取最新菜谱（每天原网站爬取）
 * 最新：https://www.meishij.net/ajax/index_more_news.php?st=5
 * 一小时最热：https://www.meishij.net/ajax/index_more_news.php?st=1
 * 今日最热：https://www.meishij.net/ajax/index_more_news.php?st=2
 * 一周最热：https://www.meishij.net/ajax/index_more_news.php?st=4
 */
router.get('/new_dish',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let type=getData.type||'new';
    let menu='';
    switch (type){
        case 'new':     menu='最新';        break;
        case 'hours':   menu='热门菜品';    break;
        case 'day':     menu='今日最热';    break;
        case 'week':    menu='一周最热';    break;
    }
    let sqlstr=`SELECT * FROM dish2 WHERE menu='${menu}' AND date LIKE '%${common.getDate('date')}%'`;
    let sqlstr2=`SELECT * FROM dish2 WHERE menu='${menu}' AND date LIKE '%${common.splitDate(common.preDate('day',1),'date')}%'`;
    sql.query(sqlstr,(err,data)=> {
        if (err) {
            console.error(err);
        }
        if (data.length>0){
            res.status(200).send({success: true, msg: '数据库获取今日菜品成功!', data: data}).end();
        }else {
            sql.query(sqlstr2,(err,data2)=> {
                if (err) {
                    console.error(err);
                }
                res.status(200).send({success: true, msg: '数据库获取昨天菜品成功!', data: data2}).end();
            });
            switch (type){
                case 'new':     reptileDayDish('/ajax/index_more_news.php?st=5','最新');        break;
                case 'hours':   reptileDayDish('/ajax/index_more_news.php?st=1','热门菜品');    break;
                case 'day':     reptileDayDish('/ajax/index_more_news.php?st=2','今日最热');    break;
                case 'week':    reptileDayDish('/ajax/index_more_news.php?st=4','一周最热');    break;
            }
        }
    });

});

function addView(dishID) {
    if (dishID){
        sql.query(`UPDATE dish2 SET _view=_view+1 WHERE ID=${dishID}`,(err,data)=>{
            if (err){
                console.error('增加菜品（'+dishID+'）观看数量出错',err);
            }else {
                //console.log('增加菜品（'+dishID+'）观看数量成功！',data);
            }
        })
    }
}

/**
 * 每一天（00:00:00）都爬取一次原网站数据
 */
(function () {
    let date='';
    setTimeout(function () {
        date=common.getDate('date');
        console.log(date);
    },0);
    setInterval(function () {
        let newDate=common.getDate('date');
        if (date!=newDate){
            console.log('新的一天：'+newDate);
            reptileMeals();
            reptileDayDish('/ajax/index_more_news.php?st=5','最新');
            reptileDayDish('/ajax/index_more_news.php?st=1','热门菜品');
            reptileDayDish('/ajax/index_more_news.php?st=2','今日最热');
            reptileDayDish('/ajax/index_more_news.php?st=4','一周最热');
        }
        date=newDate;
    },1000)
})();

module.exports=router;