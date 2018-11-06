#!/usr/bin/node
// Copyright 2018 by Jeff Anderson-Lee subject to the BSD 3-Clause License

var http = require("http"),
  url = require("url"),
  path = require("path"),
  fs = require("fs"),
  md5 = require('md5')
var port = process.argv[2] || 8888;
var rootdir = process.cwd()+"/data";
var cgidir = process.cwd()+"/cgi-bin";

var child_process = require('child_process');

function paramArgs(args) {
  if (args==undefined||args==null||args=={}) return "";
  var lis = [];
  for (var key in args) {
    if (args.hasOwnProperty( key )) {
      var val = args[key];
      if (val && val.constructor === Array) {
        for (var elem in val) {
          lis.push(key+'='+encodeURIComponent(val[elem]));
        }
      } else if (typeof val === 'string') {
        lis.push(key+'='+encodeURIComponent(val));
      }
    }
  }
  //console.log(lis.join("\n"))
  return lis.join("\n");
  //return lis.sort().join("\n");
}

function queryArgs(args) {
  if (args==undefined||args==null||args=={}) return "";
  var argstr="";
  var prefix='?';
  for (var key in args) {
    argstr += prefix+key+'='+encodeURIComponent(args[key]);
    prefix = '&';
  }
  return argstr;
}

function reqEnv(args) {
  var queryString = queryArgs(args)
  return {REQID:md5(queryString), QUERY_STRING: queryString}
}

function optText(text) { return (text==undefined ? "" : text); }
function optArgs(args) {
  if (args==undefined||args==null||args=={}) return "";
  var argstr="";
  for (var key in args) {
    argstr += ' '+key+'="'+optText(args[key])+'"';
  }
  return argstr;
}
function makeTag(tag,text,args) {
  if (text==undefined||text=='') {
    return '<'+tag+optArgs(args)+' />';
  }
  return '<'+tag+optArgs(args)+'>'+optText(text)+'</'+tag+'>';
}
function HTML(text,args) { return makeTag('html',text,args); }
function HEAD(text,args) { return makeTag('head',text,args); }
function BODY(text,args) { return makeTag('body',text,args); }
function TITLE(text,args) { return makeTag('title',text,args); }
function META(text,args) { return makeTag('meta',text,args); }

function urlRedirect(pathname,args,response) {
  response.writeHead(200, {"Content-Type": "text/html"});
  var url = 'http:/'+pathname+queryArgs(args);
  console.log("Redirecting to URL="+url);
  var html =
    HTML(
     HEAD(
       TITLE('Redirect')+
       META( '',{"http-equiv":"refresh", content:"0;URL='"+url+"'"}))+
     BODY("Redirecting to "+url, {bgcolor:"#061634"})); // eterna blue!
  response.write(html);
  response.end();
  return;
}

function breq(args,response) {
  response.writeHead(200, {"Content-Type": "text/html"});
  var child = child_process.spawn('../bin/bbatch.sh', [],
                {env: reqEnv(args)});
  child.stdout.on('data', function (data) {
    response.write(data);
    console.log('stdout: ' + data);
  });
  child.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });
  child.on('exit', function (code) {
    console.log('child exit');
    setTimeout(function(){console.log('response.end');response.end();},100);
    //response.end();
    if (code!=0) console.log('child process exited with code ' + code);
  });
  child.stdin.write('');
  child.stdin.end();
  console.log('stdin.end');
}

function dpfe(args,response) {
  response.writeHead(200);
  var cmdargs = ['seq' in args ? args.seq : 'AGCGAAAGCGAAAGCA'];
  if ('con' in args) cmdargs.push(args.con);
  var child = child_process.spawn('../bin/dpfe.sh', cmdargs);
  child.stdout.on('data', function (data) {
    response.write(data);
    //console.log('stdout: ' + data);
  });
  child.stderr.on('data', function (data) {
    //console.log('stderr: ' + data);
  });
  child.on('exit', function (code) {
    response.end();
    if (code!=0) console.log('child process exited with code ' + code);
  });
  child.stdin.end();
}

function cpp(args,response) {
  response.writeHead(200);
  var cmdargs = ['seq' in args ? args.seq : 'AGCGAAAGCGAAAGCA'];
  if ('mtf' in args) cmdargs.push(args.mtf);
  var child = child_process.spawn('../bin/cpp.sh', cmdargs);
  child.stdout.on('data', function (data) {
    response.write(data);
    //console.log('stdout: ' + data);
  });
  child.stderr.on('data', function (data) {
    //console.log('stderr: ' + data);
  });
  child.on('exit', function (code) {
    response.end();
    if (code!=0) console.log('child process exited with code ' + code);
  });
  child.stdin.end();
}

function spp(args,response) {
  response.writeHead(200);
  var cmdargs = ['seq' in args ? args.seq : 'AGCGAAAGCGAAAGCA'];
  if ('con' in args) {
    cmdargs.push(args.con);
    if ('bonus' in args) cmdargs.push(args.bonus);
  }
  var child = child_process.spawn('../bin/spp.sh', cmdargs);
  child.stdout.on('data', function (data) {
    response.write(data);
    //console.log('stdout: ' + data);
  });
  child.stderr.on('data', function (data) {
    //console.log('stderr: ' + data);
  });
  child.on('exit', function (code) {
    response.end();
    if (code!=0) console.log('child process exited with code ' + code);
  });
  child.stdin.end();
}

function fe(args,response) {
  response.writeHead(200);
  var cmdargs = ['seq' in args ? args.seq : 'AGCGAAAGCGAAAGCA'];
  if ('con' in args) cmdargs.push(args.con);
  var child = child_process.spawn('../bin/fe.sh', cmdargs);
  child.stdout.on('data', function (data) {
    response.write(data);
    //console.log('stdout: ' + data);
  });
  child.stderr.on('data', function (data) {
    //console.log('stderr: ' + data);
  });
  child.on('exit', function (code) {
    response.end();
    if (code!=0) console.log('child process exited with code ' + code);
  });
  child.stdin.end();
}

function endsWith(str,suffix) {
   if (str.length<suffix.length) return false;
   return suffix==str.substr(str.length-suffix.length,suffix.length);
}

function startsWith(str,prefix) {
   if (str.length<prefix.length) return false;
   return prefix==str.substr(0,prefix.length);
}

http.createServer(function(request, response) {
  var uri = url.parse(request.url,true);

  function bakeCookie(name, value, days, path, domain, secure) {
    var expires = false;
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days*24*60*60*1000));
      expires = escape(date.toGMTString());
    }
    var cookieString = name + "=" + escape(value);
    if (expires) cookieString += "; expires=" + escape(expires);
    if (path) cookieString += "; path=" + escape(path);
    else cookieString += "; path=" + escape("/");
    if (domain) cookieString += "; domain=" + escape(domain);
    else if(uri.hostname) cookieString += "; domain=" + escape(uri.hostname);
    if (secure) cookieString += "; secure=" + escape(secure);
    return cookieString;
  }

  var pathname = uri.pathname;
  console.log("request for "+pathname);

  if (pathname=='/dpfe' && 'query' in uri) {
    console.log("query=",uri.query);
    dpfe(uri.query,response);
    return;
  }

  if (pathname=='/cpp' && 'query' in uri) {
    console.log("query=",uri.query);
    cpp(uri.query,response);
    return;
  }

  if (pathname=='/spp' && 'query' in uri) {
    console.log("query=",uri.query);
    spp(uri.query,response);
    return;
  }

  if (pathname=='/fe' && 'query' in uri) {
    console.log("query=",uri.query);
    fe(uri.query,response);
    return;
  }

  if (pathname.match(/\.\./)) {
    console.log("WARNING: .. jailbreak attempt");
    response.writeHead(404, {"Content-Type": "text/plain; charset=us-ascii"});
    response.write("404 Not Found\n");
    response.end();
    return;
  }

  if (startsWith(pathname,'/eterna.cmu.edu/') && 'query' in uri) {
    console.log("EteRNA query=",uri.query);
    urlRedirect(pathname,uri.query,response);
    return;
  }

  if (!startsWith(pathname,'/arcplot2.') && startsWith(pathname,'/arcplot2') && 'query' in uri) {
    var filename = path.join(rootdir, "arcplot2.html");
    fs.exists(filename, function(exists) {
      if(!exists) {
        response.writeHead(404,{"Content-Type":"text/plain; charset=us-ascii"});
        response.write("404 Not Found\n");
        response.end();
        return;
      }
      console.log("query=",uri.query);
      var mime_type = mime_type = "text/html; charset=us-ascii";
      fs.readFile(filename, "binary", function(err, file) {
        if(err) {
          response.writeHead(500,{"Content-Type":"text/plain; charset=us-ascii"});
          response.write(err + "\n");
          response.end();
          return;
        }
        console.log("mime_type=",mime_type);
        response.writeHead(200, {"Content-Type": mime_type});
        response.write(file, "binary");
        response.end();
      });
    });
    return;
  }

  var filename = path.join(rootdir, pathname);
  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain; charset=us-ascii"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }
    if (fs.statSync(filename).isDirectory()) filename += '/index.html';
  });
  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain; charset=us-ascii"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }
    fs.readFile(filename, "binary", function(err, file) {
      if(err) {
        response.writeHead(500, {"Content-Type": "text/plain; charset=us-ascii"});
        response.write(err + "\n");
        response.end();
        return;
      }
      var mime_type = "text/plain; charset=us-ascii";
      if (endsWith(filename,".html")) {
        mime_type = "text/html; charset=us-ascii";
      } else if (endsWith(filename,".css")) {
        mime_type = "text/css";
      } else if (endsWith(filename,".ico")) {
        mime_type = "image/x-icon";
      } else if (endsWith(filename,".js")) {
        mime_type = "text/javascript";
      }
      if (request.headers.cookie) {
         console.log("cookie=",request.headers.cookie);
      }
      console.log("mime_type=",mime_type);
      response.writeHead(200, {"Content-Type": mime_type,
                               "Set-Cookie": bakeCookie("foo","bar",1)});
      response.write(file, "binary");
      response.end();
    });
  });
}).listen(parseInt(port, 10));

console.log("Static file server running at\n => http://localhost:" + port +
            "\n serving files from " + rootdir +
            "\nCTRL + C to shutdown");
