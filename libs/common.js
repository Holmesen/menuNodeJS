var host='http://www.holmesen.club';
function getDate() {
    let date = new Date();
    let year = date.getFullYear();
    let month = (date.getMonth()+1).length<2?('0'+(date.getMonth()+1).toString()):(date.getMonth()+1);
    let day = (date.getDate()).length<2?('0'+(date.getDate()).toString()):(date.getDate());
    let hour = (date.getHours()).length<2?('0'+(date.getHours()).toString()):(date.getHours());
    let minute = (date.getMinutes()).length<2?('0'+(date.getMinutes()).toString()):(date.getMinutes());
    let second = (date.getSeconds()).length<2?('0'+(date.getSeconds()).toString()):(date.getSeconds());
    //console.log(year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second);
    return year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second;
}
function getDate(dateTimeType) {
    let date = new Date();
    let year = date.getFullYear();
    let month = (date.getMonth()+1).length<2?('0'+(date.getMonth()+1).toString()):(date.getMonth()+1);
    let day = (date.getDate()).length<2?('0'+(date.getDate()).toString()):(date.getDate());
    let hour = (date.getHours()).length<2?('0'+(date.getHours()).toString()):(date.getHours());
    let minute = (date.getMinutes()).length<2?('0'+(date.getMinutes()).toString()):(date.getMinutes());
    let second = (date.getSeconds()).length<2?('0'+(date.getSeconds()).toString()):(date.getSeconds());
    //console.log(year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second);
    if (dateTimeType=='date'){
        return year+'年'+month+'月'+day+'日';
    }else {
        if (dateTimeType=='time'){
            return hour+':'+minute+':'+second;
        }else {
            return year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second;
        }
    }
}
function preDate(node, offset) {
    let date = new Date();
    let year = node=='year'?(date.getFullYear()-offset):(date.getFullYear());
    let month = node=='month'?(date.getMonth()+1-offset):(date.getMonth()+1);
    let day = node=='day'?(date.getDate()-offset):(date.getDate());
    let hour = node=='hour'?(date.getHours()-offset):(date.getHours());
    let minute = node=='minute'?(date.getMinutes()-offset):(date.getMinutes());
    let second = node=='second'?(date.getSeconds()-offset):(date.getSeconds());
    return year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second;
}
function nextDate(node, offset) {
    let date = new Date();
    let year = node=='year'?(date.getFullYear()+offset):(date.getFullYear());
    let month = node=='month'?(date.getMonth()+1+offset):(date.getMonth()+1);
    let day = node=='day'?(date.getDate()+offset):(date.getDate());
    let hour = node=='hour'?(date.getHours()+offset):(date.getHours());
    let minute = node=='minute'?(date.getMinutes()+offset):(date.getMinutes());
    let second = node=='second'?(date.getSeconds()+offset):(date.getSeconds());
    return year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second;
}
function splitDate(date,part) {
    if (date.indexOf(' ')!=-1){
        if (part=='date'){
            return date.split(' ')[0];
        }else {
            if (part=='time'){
                return date.split(' ')[1];
            }else {
                return date;
            }
        }
    }else {
        return date;
    }
}
function date2timestamp(date) {
    if (date.indexOf('年')!=-1 && date.indexOf('月')!=-1 && date.indexOf('日')!=-1){
        date=date.replace(/年/,'-');
        date=date.replace(/月/,'-');
        date=date.replace(/日/,'');
        return date.getTime();
    }
}
function timestamp2date(timestamp) {
    var date = new Date(timestamp);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
    Y = date.getFullYear() + '年';
    M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '月';
    D = date.getDate() + '日 ';
    h = date.getHours() + ':';
    m = date.getMinutes() + ':';
    s = date.getSeconds();
    return Y+M+D+h+m+s;
}
module.exports={
    getDate:getDate,
    date2timestamp:date2timestamp,
    timestamp2date:timestamp2date,
    preDate:preDate,
    nextDate:nextDate,
    splitDate:splitDate,
    host:host
};