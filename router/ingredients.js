/**
 * Created by 13156 on 2018/10/28.
 */
const express=require('express');
const router=express.Router();
const bodyParser=require('body-parser');
const http=require('http');
const https=require('https');
const myUrl=require('url');
const querystring=require('querystring');
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

/**
 * 获取食材信息
 */
router.get('/ingredients',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let id=getData.ingredientsID;
    sql.query(`SELECT * FROM ingredients3 WHERE ID=${id}`,(err,data)=>{
        if (err){
            console.error(err);
            res.status(500).send('获取食材失败!').end();
        }else {
            res.status(200).send({msg:'获取食材成功!',data:data}).end();
        }
    })
});

/**
 * 获取类别
 */
router.get('/category',(req,res)=>{
    sql.query(`SELECT category FROM ingredients3 GROUP BY category`,(err,data)=>{
        if (err){
            console.error(err);
            res.status(500).send({success:false,msg:'获取分类失败!',data:data}).end();
        }else {
            res.status(200).send({success:true,msg:'获取分类成功!',data:data}).end();
        }
    })
});

/**
 * 获取子类别
 */
router.get('/subcategory',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let category=getData.category;
    let sqlstr='';
    if (category){
        sqlstr=`SELECT subcategory FROM ingredients3 WHERE category=${category} GROUP BY subcategory`;
    }else {
        sqlstr=`SELECT category,subcategory FROM ingredients3 GROUP BY subcategory`;
    }
    sql.query(sqlstr,(err,data)=>{
        if (err){
            console.error(err);
            res.status(500).send({success:false,msg:'获取子分类失败!',data:data}).end();
        }else {
            res.status(200).send({success:true,msg:'获取子分类成功!',data:data}).end();
        }
    })
});

/**
 * 获取类别食材
 */
router.get('/cate_ingred',(req,res)=>{
    if (req.url.indexOf('?')!=-1){
        let getData=(myUrl.parse(req.url,true)).query;
        if (getData.cate){
            let cate=getData.cate;
            let limit=getData.limit||0;
            let offset=getData.offset||20;
            sql.query(`SELECT * FROM ingredients3 WHERE category='${cate}' LIMIT ${limit},${offset}`,(err,data)=>{
                if (err){
                    console.error(err);
                    res.status(500).send({success:false,msg:'获取分类食材失败!',data:data}).end();
                }else {
                    res.status(200).send({success:true,msg:'获取分类食材成功!',data:data}).end();
                }
            })
        }else {
            res.status(500).send({success:false,msg:'cate参数错误!'}).end();
        }
    }else {
        res.status(500).send({success:false,msg:'参数错误!'}).end();
    }
});

/**
 * 获取子类别食材
 */
router.get('/subcate_ingred',(req,res)=>{
    if (req.url.indexOf('?')!=-1){
        let getData=(myUrl.parse(req.url,true)).query;
        if (getData.subcate){
            let subcate=getData.subcate;
            let limit=getData.limit||0;
            let offset=getData.offset||20;
            sql.query(`SELECT * FROM ingredients3 WHERE subcategory='${subcate}' LIMIT ${limit},${offset}`,(err,data)=>{
                if (err){
                    console.error(err);
                    res.status(500).send({success:false,msg:'获取子分类食材失败!',data:data}).end();
                }else {
                    res.status(200).send({success:true,msg:'获取子分类食材成功!',data:data}).end();
                }
            })
        }else {
            res.status(500).send({success:false,msg:'subcate参数错误!'}).end();
        }
    }else {
        res.status(500).send({success:false,msg:'参数错误!'}).end();
    }
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
        res.status(400).send({success:false,msg:'shicai参数错误!'}).end();
    }
});

/**
 * 获取名字相似菜品
 */
router.get('/ingredients_like',(req,res)=>{
    let getData=(myUrl.parse(req.url,true)).query;
    let limit=getData.limit||0;
    let offset=getData.offset||20;
    sql.query(`SELECT * FROM ingredients3 WHERE name LIKE '%${getData.key}%' LIMIT ${limit},${offset}`,(err,data)=>{
        if (err){
            console.error(err);
            res.status(500).send({success:false,msg:'查找相似食材失败!',data:data}).end();
        }else {
            res.status(200).send({success:true,msg:'查找相似食材成功!',data:data}).end();
        }
    })
});


module.exports=router;