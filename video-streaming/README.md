## Video Streaming
Used local file as well as remote/cloud file to be streamed through this server. Understanding and implementation are similar except retrieval of desired file.

- Setup a frontend with few controls which can play the video. [Video Js](https://videojs.com/)
- Instead of static file location (in index.html) of your video give the route you are going to write. eg. `/video/:file`, `/remote/:file`
- Respective route will be requested along with a `range` present in the header.

Now approach will be the same for both method, but way might change. 🥱
- Get the complete size of the video file.
- Parse the `start` and `end` byte from the `range`. `end` might be empty so you can decide value for it. I thought 2 method for it - i) Simplest way is to assign `end` to the size of the file. ii) Or you can send some chunks per request like 1MB (more or less). This might save some bandwidth on server if user seek video frequently.
- Build the headers with particular information to be sent. (same on both ways)
- Get a readable stream for required range from the file and pipe it to the response.
- Voila 🥳 we are done with writing, now let's try it.

Hope You liked this :)