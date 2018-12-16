/**
 * Created by 13156 on 2018/11/27.
 */
const common=require('./common');
const http=require('http');
const https=require('https');
const cheerio=require('cheerio');
const mysql=require('mysql');
const sql=mysql.createPool({
    limit:10,
    host:'localhost',
    user:'root',
    password:'0000',
    database:'menu'
});

//gotoDish([{name:'哈哈',imgSrc:'www.baidu.com',href:'https://www.meishij.net/zuofa/malaxiangguo_111.html'}],'午餐');

/**
 * 跳转到菜品详细界面
 * @param hrefList
 */
function gotoDish(hrefList,callback=null) {
    let list={name:'',link:'',imgSrc:'',effects:'',others:'',ZhuLiao:'',PeiLiao:'',Step:''};
    let dishEffectList=[];
    let dishOtherList=[];
    let dishZhuLiao=[];
    let dishPeiLiao=[];
    let dishStep=[];
    let x=0;
    for (let i=0;i<hrefList.length;i++){
        let por=null;
        //console.log((hrefList[i].href).substring(0,4));
        if (hrefList[i].href!=''&&(hrefList[i].href).substring(0,5)=='https')
            por=https;
        else if (hrefList[i].href!='') por=http;
        if (por!=null)
            por.get(hrefList[i].href,function (res) {
                let html='';
                res.on('data',chunk=>{
                    html+=chunk;
                });
                res.on('end',()=>{
                    //console.log('该链接('+hrefList[i].href+')爬取的数据如下:');
                    let sm=getDishSM(html);
                    dishEffectList=getDishEffectList(html);
                    //console.log(dishEffectList);
                    dishOtherList=getDishOther(html);
                    //console.log(dishOtherList);
                    dishZhuLiao=getDishZhuLiao(html);
                    //console.log(dishZhuLiao);
                    dishPeiLiao=getDishPeiLiao(html);
                    dishStep=[];
                    let step=getDishStep(html);
                    if (step.length==0){
                        //console.log('执行了getNewDishStep');
                        dishStep=getNewDishStep(html);
                    }else {
                        dishStep=step;
                    }
                    //console.log(dishStep);


                    list.name=hrefList[i].name;
                    list.link=hrefList[i].href;
                    list.imgSrc=hrefList[i].imgSrc;
                    list.effects=dishEffectList;
                    list.others=dishOtherList;
                    list.ZhuLiao=dishZhuLiao;
                    list.PeiLiao=dishPeiLiao;
                    list.Step=dishStep;

                    let view= Math.floor(1357*Math.pow(Math.random(),2));
                    let like=Math.floor(view*Math.random());
                    let unlike=Math.floor(like*Math.random()/3);
                    let collect=Math.floor(like*Math.random());

                    //console.log(list);
                    let date=common.getDate();

                    let str=`INSERT INTO dish2(name,user_id,user_name,img_src,menu,cuisine,taste,ingredients,
                    excipient,seasoning,practice,features,date,time1,time2,difficult,component,link,suitable,
                    process,_like,unlike,collection,_view,description)
                     VALUES("${list.name}",3,"Holmesen","${list.imgSrc}","${hrefList[i].menu}","${hrefList[i].cuisine}","${list.others.KW}",
                     '${JSON.stringify(list.ZhuLiao)}','${JSON.stringify(list.PeiLiao.fuliao)}',
                     '${JSON.stringify(list.PeiLiao.tiaoliao)}','${JSON.stringify(list.Step)}',"${list.effects}","${date}",
                     "${list.others.PRSJ}","${list.others.ZBSJ}","${list.others.ND}","${list.others.RS}","${list.link}",
                     "${hrefList[i].cuisine}","${list.others.GY}",${like},${unlike},${collect},${view},'${sm}')`;

                    sql.query(str,function (err) {
                        if (err){
                            console.error(err);
                        }else {
                            //console.log('插入成功！');
                        }
                        x+=1;
                        if (x==hrefList.length-1){
                            if (callback && (typeof callback)=='function'){
                                callback();
                            }
                        }
                    });
                    //console.log(str);

                    html='';
                })
            });
        /*list.push({
         dishEffectList:dishEffectList,
         dishOtherList:dishOtherList,
         dishZhuLiao:dishZhuLiao,
         dishPeiLiao:dishPeiLiao,
         step:dishStep
         })*/
    }
    //return list;
}

/**
 * 获取菜品功效
 * @param html
 * @returns {Array}
 */
function getDishEffectList(html) {
    if (html){
        var $=cheerio.load(html);
        var dishEffect=$('.yj_tags');
        var dishEffectList=[];
        dishEffect.find('dt').each(function (item) {
            var foodEffect=$(this);
            var effectName=foodEffect.find('a').text();
            dishEffectList.push(effectName);
        });
        return dishEffectList;
    }else {
        console.log('无数据传入！');
    }
}

function getDishSM(html) {
    if (html){
        var $=cheerio.load(html);
        var sm=$('.materials').find('p').first().text();
        return sm;
    }else {
        console.log('无数据传入！');
    }
}

/**
 * 获取菜品的其他信息（工艺、难度、人数、口味、准备时间、烹饪时间）
 * @param html
 * @returns {Array}
 */
function getDishOther(html) {
    if (html){
        var $=cheerio.load(html);
        var dishOther=$('.info2');
        var dishOtherList={GY:'',ND:'',RS:'',KW:'',ZBSJ:'',PRSJ:''};
        dishOther.find('li').each( function (item) {
            var foodOther=$(this);
            var aa=foodOther.find('a');
            switch (aa.attr('id')){
                case 'tongji_gy': dishOtherList.GY=aa.text();break;
                case 'tongji_nd': dishOtherList.ND=aa.text();break;
                case 'tongji_rsh': dishOtherList.RS=aa.text();break;
                case 'tongji_kw': dishOtherList.KW=aa.text();break;
                case 'tongji_zbsj': dishOtherList.ZBSJ=aa.text();break;
                case 'tongji_prsj': dishOtherList.PRSJ=aa.text();break;
            }
        });
        return dishOtherList;
    }else {
        console.log('无数据传入！');
    }
}

/**
 * 获取菜品主料
 * @param html
 * @returns {Array}
 */
function getDishZhuLiao(html) {
    var $=cheerio.load(html);
    var dishZhuLiao=$('.zl');
    var dishZhuLiaoList=[];
    dishZhuLiao.find('li').each(function (item) {
        var foodZhuLiao=$(this);
        var zhuLiaoName=foodZhuLiao.find('.c').children('h4').find('a').text();
        var zhuLiaoWeight=foodZhuLiao.find('.c').children('h4').find('span').text();
        dishZhuLiaoList.push({
            zhuLiaoName:zhuLiaoName,
            zhuLiaoWeight:zhuLiaoWeight
        });
    });
    return dishZhuLiaoList;
}

/**
 * 获取菜品配料（辅料、调料）
 * @param html
 * @returns {Array}
 */
function getDishPeiLiao(html) {
    if (html){
        var $=cheerio.load(html);
        var dishPeiLiao=$('.materials_box');
        var dishPeiLiaoList={fuliao:'',tiaoliao:''};
        var fuliaoList=[];
        var tiaoliaoList=[];
        dishPeiLiao.find('.fuliao').each(function (item) {
            var foodPeiLiao=$(this);
            var peiLiaoNameList=foodPeiLiao.find('ul');
            var fuLiaoNameList=$(peiLiaoNameList);
            var tiaoLiaoNameList=$(peiLiaoNameList);
            var peiliaoType=foodPeiLiao.find('h3').children('a').text();
            if (peiliaoType=='辅料'){
                fuLiaoNameList.find('li').each(function (item) {
                    var FuLiao=$(this);
                    var fuliaoName=FuLiao.find('h4').children('a').text();
                    var fuliaoWeight=FuLiao.find('span').text();
                    fuliaoList.push({
                        fuliaoName:fuliaoName,
                        fuliaoWeight:fuliaoWeight
                    });
                });
            }else {
                if (peiliaoType=='调料'){
                    tiaoLiaoNameList.find('li').each(function (item) {
                        var TiaoLiao=$(this);
                        var tiaoliaoName=TiaoLiao.find('h4').children('a').text();
                        var tiaoliaoWeight=TiaoLiao.find('span').text();
                        tiaoliaoList.push({
                            tiaoliaoName:tiaoliaoName,
                            tiaoliaoWeight:tiaoliaoWeight
                        });
                    });
                }
            }

        });
        dishPeiLiaoList.fuliao=fuliaoList;
        dishPeiLiaoList.tiaoliao=tiaoliaoList;
        //console.log(dishPeiLiaoList);
        return dishPeiLiaoList;
    }
}

/**
 * 获取菜品做法
 * @param html
 * @returns {Array}
 */
function getDishStep(html) {
    if (html){
        var $ = cheerio.load(html);
        var dishStep = $('.editnew');
        var dishStepList = [];

        dishStep.find('div').each(function(item) {
            var step = $(this);
            var stepText = step.find('.c').children('p').first().text();
            var stepImg = step.find('.c').children('p').last().children('img').attr('src');
            if (stepText!=''||stepImg!=undefined){
                dishStepList.push({
                    stepText : stepText,
                    stepImg : stepImg
                });
            }
        });
        //console.log(dishStepList);
        return dishStepList;
    }
}

/**
 * 获取菜品做法（新的）
 * @param html
 * @returns {Array}
 */
function getNewDishStep(html) {
    var $=cheerio.load(html);
    var newDishStep=$('.edit_class_0');
    var newDishStepList=[];
    var step={newStepText:'',newStepImgSrc:''};
    newDishStep.find('p').each(function (item) {
        var newStep=$(this);
        //var stepName=newStep.find()
        var txt=newStep.text();

        if (txt!=''&&txt!=null){
            if (step.newStepText!=''||step.newStepImgSrc!='')
                newDishStepList.push(step);
            step={newStepText:'',newStepImgSrc:''};
            //console.log('文字');
            var newStepText=txt;
            step.newStepText=newStepText;
            //newDishStepList.push(newStepText);
        }else {
            //console.log('图片');
            var newStepImgSrc=newStep.find('img').attr('src');
            step.newStepImgSrc=newStepImgSrc;
            //newDishStepList.push(newStepImgSrc);
        }

    });
    //console.log(newDishStepList);
    return newDishStepList;
}

module.exports={
    gotoDish:gotoDish
};