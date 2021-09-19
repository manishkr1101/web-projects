
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const request = require('request');

const { getContentLength } = require('./util');

app.get('/', (req, res) => {
    // fs.createReadStream(__dirname+'/index.html').pipe(res);
    res.sendFile(__dirname+'/index.html');
});
const log = console.log;


app.get('/remote/:filename', (req, res) => {
    // hardcoded but can be replaced. uses cloud storage url for streaming
    let fileUrl = 'https://firebasestorage.googleapis.com/v0/b/hackathone-19.appspot.com/o/videoplayback.mp4?alt=media&token=4d687199-e7e4-4dda-8d27-536a87553f76'
    
    
    var range = req.headers.range; // player send request along with this
    if(!range){
        res.send('403');
    }
    var positions, start, end, total, chunksize;
        

    getContentLength(fileUrl)
        .then(contentLength => {
            setResponseHeaders(contentLength);
            pipeToResponse();
        })
        .catch(err => res.send(err))

    function setResponseHeaders(contentLength){
        positions = range.replace(/bytes=/, "").split("-"); // bytes=498-48974
        start = parseInt(positions[0], 10); 
        total = contentLength;
        // total = 13010768; for above hardcoded video
        end = positions[1] ? parseInt(positions[1], 10) : start + 1000000; // sending 1mb with each request by default
        if(end>=total) {
            end = total-1;
        }
        chunksize = (end-start)+1;
      
        res.writeHead(206, { 
          "Content-Range": "bytes " + start + "-" + end + "/" + total, 
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type":"video/mp4"
        });
      } 

      function pipeToResponse(){
          console.log(`requesting from cloud : bytes=${start}-${end}`);
          request({
              url: fileUrl,
              headers: {
                  range: `bytes=${start}-${end}`, // drive api must support this
                  connection: 'keep-alive'
              }
          },(err, res, body) => {
              if(err) {
                  console.log(err)
              }
          }).pipe(res);
      }
});

// for streaming local file
app.get('/video/:filename', (req, res) => {
    
    const filename = req.params.filename;
    const filepath =  path.resolve(__dirname, filename); //__dirname + '/' + filename;
    if(!fs.existsSync(filepath)) {
        res.writeHead(404);
        res.end();
        return;
    }
    const stat = fs.statSync(filepath);
    const total = stat.size;

    if(req.headers.range){
        var range = req.headers.range;
        var parts = range.replace(/bytes=/, "").split("-");
        var partialstart = parts[0];
        var partialend = parts[1];
        var start = parseInt(partialstart, 10);
        var end = partialend ? parseInt(partialend, 10) : total-1;
        var chunksize = (end-start)+1;
        console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

        var file = fs.createReadStream(filepath, {start: start, end: end});
        res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
        file.pipe(res);
    }
    else{
        console.log('ALL: ' + total);
        // res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
        // fs.createReadStream(filepath).pipe(res);
        res.writeHead(403);
        res.end();
    }

});




app.listen(3000, () => {
    console.log('app running on port 3000');
});
