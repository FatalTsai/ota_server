//ref :https://www.jianshu.com/p/934d3e8d371e

const fetch = require('node-fetch');
var fs = require('fs'); // 引入fs模块
var path =require('path')
//const filepath='R4.0.0.zip'
const filepath = 'Native.mp4'
const folder = foldername()
//const folder = './temp'

//获取响应头信息
function getResHeaders(url) {
    return new Promise(function (resolve, reject) {
        fetch(url, {
            method: "post", //请求方式
            body: JSON.stringify({file : filepath}),
            // mode: 'cors',
            headers: { //请求头
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                Pragma: "no-cache",
               
                'Content-Type' : 'application/json',
                Range: "bytes=0-1"

            }
        }).then(r => {
            let h = {};
            r.headers.forEach(function (v, i, a) {
                h[i.toLowerCase()] = v;
            });
            return resolve(h);
        }).catch(reject);
    });
}
//下载块
async function  downloadBlock(url, o) { // var o is etag and Range,
    let option = {
        //'Content-Type': 'application/octet-stream',
        //'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Type' : 'application/json',
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        Pragma: "no-cache"
    };
    if (typeof o == "string") {
        option["Range"] = "bytes=" + o;
    } 
    else if (typeof o == "object") {
        option = Object.assign(option, o);
    }
    //console.log('o = '+ o )
    //console.log(option)


    //console.log(option)
    return await fetch(url, {
        method: 'Post',
        headers: option,
        
        //body : JSON.stringify({ 'file':'R4.0.0.zip'})
        //body : JSON.stringify({ 'file':'Native.mp4'})

        
        body: JSON.stringify({file : filepath})
        

    }).then(res => res.buffer());
}

let blist = []
function combine(filenumber)
{
    
    for(let i =0 ;i<=Number(filenumber); i++)
    {   
        console.log('combine : ota '+i)
        var buff = fs.readFileSync(path.join(__dirname,folder+'/ota'+i))
        blist.push(buff)        
    }
    fs.writeFile(filepath,Buffer.concat(blist),function(err){
        if(err) throw err
        console.log('combined!!!')
    })
}

function foldername()
{   
    if(!fs.existsSync('./temp') )
        return './temp'

     
    var count =1
    while(fs.existsSync('./temp('+count+')/') ) count ++
    

    return './temp('+count+')/'

}

(async function () {  
    // let url = "http://cdn.npm.taobao.org/dist/node/v10.14.2/node-v10.14.2-x64.msi";
    //let url = "https://www.python.org/ftp/python/3.7.2/python-3.7.2-amd64.exe";
    //let url ="https://www.jianshu.com/p/934d3e8d371e"

    let url = "http://localhost:1628/ota"

    let fileName = url.split("/").reverse()[0].split("?")[0];
    let fileBuffer = null;
    //获取请求头信息
    let h = await getResHeaders(url);
    let contextLength = h["context-length"];

    //console.log('contentlength = '+contentLength)
    //分块大小
    //let blockSize = 1024 * 1024 * 4;//b
    let blockSize = 1024*1024*50
    
    fs.mkdirSync(folder)

    let contentRange = h['range']

    console.log(h)


    //判断是否支持分段*下载
    
    if (h['accept-ragnes']='bytes') {
        //获取文件大小
        //let contentLength = Number(contentRange.split("/").reverse()[0]);
        //判断是否后需要分块下载
        let etag = h.etag;
        let contentType = h["content-type"];
        let blockLen = Math.ceil(contextLength / blockSize);
        console.log('blocklen = '+blockLen)
        let blist = [];foldername()
        //计算分块foldername()
        for (let i = 0, strat, end; i < blockLen; i++) {foldername()
            strat = i * blockSize;foldername()
            end = (i + 1) * blockSize - 1;foldername()
            end = end > contextLength ? contextLength : end;
            console.log("download:",strat, end);
            let buffer = await downloadBlock(url, {
                etag: etag,
                //'Content-Type': contentType,
                "Range": "bytes=" + strat + "-" + end
            });


            console.log(folder)

            
            
            fs.writeFile(folder+'/'+fileName+Number(i),buffer,function(err)
            {
                //if(err)throw err;
                console.log('Saved '+Number(i))
                if(i == blockLen-1)
                {
                    combine(i)
                }
            });
               
            blist.push(buffer);

        }
        fileBuffer = Buffer.concat(blist);
    }
    if (!fileBuffer) {
        //直接下载
        fileBuffer = await downloadBlock(url, {});
    }
    if (fileBuffer) {
        //保存文件
        //combine(filenumber)
        /*
        fs.writeFile(fileName, fileBuffer, function (err) {
            if (err) throw err;
            console.log('Saved.');
        });*/
    }
})();