//ref :https://www.jianshu.com/p/934d3e8d371e
const process = require('process') //引入process模組 使用函數process.argv取得命令列參數
const fetch = require('node-fetch')//引入 node-fetch模組 //npm i node-fetch 需要特別安裝
var fs = require('fs'); // 引入fs模块
const path =require('path')
const filepath='R4.0.0.zip' //檔案路徑 可以改變此變數 來決定取得的
//const filepath = 'Native.mp4'

const fileName = path.basename(filepath)
const folder = filepath+'_tmp'

//0922130318
//ref :https://www.jianshu.com/p/934d3e8d371e
//此函數用以取得 server發出的hearder檔
function getResHeaders(url) { 
    return new Promise(function (resolve, reject) {
        fetch(url, {
            method: "post", //取的方法
            body: JSON.stringify({file : filepath}), //server那一端會要求 body.file
           
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
                h[i.toLowerCase()] = v; //把res.header的key都轉成全小寫,方便而已
            })  
            return resolve(h);
        }).catch(reject);
    });
}


//此函數回傳檔案區塊 url：要抓取的檔案 , o:檔案區段
async function  downloadBlock(url, o) { // var o is  Range, "Range": "bytes=" + strat + "-" + end 
    let option = {                      //var o的物件會被加進option

        //'Content-Type': 'application/octet-stream',
        
        'Content-Type' : 'application/json', //如果不改成這個server那一端會抓不太到body
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
//

//此函數將分段下載的小檔案,合併還原成大檔
function combine(filenumber) //filenumber :有多少個小檔案
{   //將檔案讀取後 以buffer的型態存於bufferlist
    let bufferlist = []
    //從最前面的檔案 依序放進 bufferlist
    for(let i =0 ;i<=Number(filenumber);i++)
    {   
        console.log('combine : '+fileName+i)
        var buff = fs.readFileSync(path.join(__dirname,folder+'/'+fileName+i))
        bufferlist.push(buff)        
    }
    //將bufferlist的buffer合併 並寫入目標路徑
    fs.writeFile(filepath,Buffer.concat(bufferlist),function(err){
        if(err) throw err
        console.log('combined!!!')
    })
}

function foldername() //這個函數後來沒用到 我改變資料夾命名的方式
{   
    if(!fs.existsSync('./temp') ) //如果 .temp這個目錄不存在 就用此命名
        return './temp'

     
    var count =1    //否則就以 temp(1),temp(2)....依序命名 不覆寫原本的資料夾
    while(fs.existsSync('./temp('+count+')/') ) count ++
    

    return './temp('+count+')/'

}

//負責檔案的下載        
//url：目標路徑 ,contenxtLength: 檔案大小 ,blockSize :區塊大小 ,unsavedfile: 還沒儲存到的區塊（用於檔案重新下載）                          
async function downloadfile(url,contextLength,blockSize,unsavedfile)
{
    //let fileName = url.split("/").reverse()[0].split("?")[0];

    //let etag = h.etag;
    //暫時先不用 etag 
    
    let blockLen = Math.ceil(contextLength / blockSize); //計算總共需要將檔案切成幾個區塊
    console.log('blocklen = '+blockLen)

    let downloadlist = [];
    for(let i=0;i<blockLen;i++)
        downloadlist.push(i) //downloadlist 初始化設為: [0,1,2....,blockLen-1]


    downloadlist = downloadlist.filter(x => !unsavedfile.includes(x) );
    //取 downloadlist 與 unsavedfile的差集 --->已經下載完成的檔案


    //依序 下載還沒儲存完整的分段
    for(let i=0;i<unsavedfile.length;i++)
    {
        let strat = unsavedfile[i] * blockSize;
        let end = (unsavedfile[i] + 1) * blockSize - 1; //讀取的開始點,結束點
        end = end > contextLength ? contextLength : end;
        console.log("download:",strat, end);
        let buffer = await downloadBlock(url, {
            //etag: etag,
            //'Content-Type': contentType,
            "Range": "bytes=" + strat + "-" + end
        });

       
            
            
        await fs.writeFile(folder+'/'+fileName+Number(unsavedfile[i]),buffer,async function(err) //將分段檔案先存入
        {
            if(err)
                console.log('writeFaild '+unsavedfile[i])

            await fs.writeFileSync( folder+'/'+fileName+'_console','Saved '+Number(unsavedfile[i])+'\n',{flag : 'a'}) 
            //紀錄哪些檔案已經完全下載好----> 寫於紀錄檔
            downloadlist.push(unsavedfile[i])
            console.log('Saved '+Number(unsavedfile[i]))
            
            if(downloadlist.length == blockLen)//如果所有分段檔案都下載完成 ,就開始合併
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

    let url = "http://localhost:1628/ota"   //主機位置
    let h = await getResHeaders(url);   //先讀取 request header 先獲取 檔案大小
    let contextLength = h["context-length"];
    const blockSize =1024*1024
    const blockLen = Math.ceil(contextLength / blockSize);
    
    //如果 儲存分段檔案的資料夾不存載在就建立之
    if(!fs.existsSync(folder))
        fs.mkdirSync(folder)

    
    let unsavedfile=[]
    for(var i=0;i<blockLen;i++)
    {
        unsavedfile.push(i)
    }
    //將unsavedfile初始化設為 = [1,2,3....,blockLen]

    const argv = process.argv   //讀取命令列 參數
    
    //如果參數列的尾端有 "-re" ---> 接續下載先前尚未完成的下載
    if(argv[argv.length-1] == '-re' && fs.existsSync(__dirname+'/'+folder+'/'+fileName+'_console'))
    {
        let tmp =await fs.readFileSync(__dirname+'/'+folder+'/'+fileName+'_console','utf8')
        let consolefile = tmp.split('Saved').join('').split('\n').map(function(item){
            return parseInt(item,10)
        })//讀取先前已經儲存過的分段檔案
        
        unsavedfile = unsavedfile.filter(x => !consolefile.includes(x))
        console.log(unsavedfile)
    }
    


    //判斷是否支持/需要 斷點續傳
    
    if (h['accept-ragnes']='bytes' && contextLength > blockSize) {

        downloadfile(url,contextLength,blockSize,unsavedfile)


    }
    else
    {
        //直接下載
        const fileBuffer = await downloadBlock(url, {});
        fs.writeFile(filepath,fileBuffer,function(err){
            if(err) throw err
            console.log('directly download!!!')
        })
    }

   
})();