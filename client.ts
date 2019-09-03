//ref :https://www.jianshu.com/p/934d3e8d371e
const process = require('process') //引入process模組 使用函數process.argv取得命令列參數
const fetch = require('node-fetch')
var fs = require('fs'); // 引入fs模块
const path =require('path')
const filepath='R4.0.0.zip'
//const filepath = 'Native.mp4'




const fileName = path.basename(filepath)
const folder = filepath+'_tmp'



function getResHeaders(url) { 
    return new Promise(function (resolve, reject) {
        fetch(url, {
            method: "post", 
            body: JSON.stringify({file : filepath}),
           
            headers: { 
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
   
    
    for(let i =0 ;i<=Number(filenumber);i++)
    {   
        console.log('combine : '+fileName+i)
        var buff = fs.readFileSync(path.join(__dirname,folder+'/'+fileName+i))
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


async function downloadfile(url,contextLength,blockSize,unsavedfile)
{
    //let fileName = url.split("/").reverse()[0].split("?")[0];

    //let etag = h.etag;
    //暫時先不用 etag 
    
    let blockLen = Math.ceil(contextLength / blockSize);
    console.log('blocklen = '+blockLen)

    let downloadlist = [];
    for(let i=0;i<blockLen;i++)
        downloadlist.push(i)


    downloadlist = downloadlist.filter(x => !unsavedfile.includes(x) );


    for(let i=0;i<unsavedfile.length;i++)
    {
        let strat = unsavedfile[i] * blockSize;
        let end = (unsavedfile[i] + 1) * blockSize - 1;
        end = end > contextLength ? contextLength : end;
        console.log("download:",strat, end);
        let buffer = await downloadBlock(url, {
            //etag: etag,
            //'Content-Type': contentType,
            "Range": "bytes=" + strat + "-" + end
        });

       
            
            
        await fs.writeFile(folder+'/'+fileName+Number(unsavedfile[i]),buffer,async function(err)
        {
            if(err)
                console.log('writeFaild '+unsavedfile[i])

            await fs.writeFileSync( folder+'/'+fileName+'_console','Saved '+Number(unsavedfile[i])+'\n',{flag : 'a'})
            downloadlist.push(unsavedfile[i])
            console.log('Saved '+Number(unsavedfile[i]))
            
            if(downloadlist.length == blockLen)
            {   
                combine(blockLen-1)

            }
        });

    }
    


}


(async function () {  
    // let url = "http://cdn.npm.taobao.org/dist/node/v10.14.2/node-v10.14.2-x64.msi";
    //let url = "https://www.python.org/ftp/python/3.7.2/python-3.7.2-amd64.exe";
    //let url ="https://www.jianshu.com/p/934d3e8d371e"

    let url = "http://localhost:1628/ota"
    let h = await getResHeaders(url);
    let contextLength = h["context-length"];
    const blockSize =1024*1024
    const blockLen = Math.ceil(contextLength / blockSize);

    if(!fs.existsSync(folder))
        fs.mkdirSync(folder)




    let unsavedfile=[]
    for(var i=0;i<blockLen;i++)
    {
        unsavedfile.push(i)
    }
    const argv = process.argv
    
    if(argv[argv.length-1] == '-re')
    {
        let tmp =await fs.readFileSync(__dirname+'/'+folder+'/'+fileName+'_console','utf8')
        let consolefile = tmp.split('Saved').join('').split('\n').map(function(item){
            return parseInt(item,10)
        })
        //console.log(consolefile)

        unsavedfile = unsavedfile.filter(x => !consolefile.includes(x) );
        console.log(unsavedfile)
    }
    


    //判断是否支持/需要 斷點續傳
    
    if (h['accept-ragnes']='bytes' && contextLength > blockSize) {

        downloadfile(url,contextLength,blockSize,unsavedfile)


    }
    else
    {
        //直接下载
        const fileBuffer = await downloadBlock(url, {});
        fs.writeFile(filepath,fileBuffer,function(err){
            if(err) throw err
            console.log('directly download!!!')
        })
    }

   
})();