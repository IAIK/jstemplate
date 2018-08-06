var http = require('http');
var fileSystem = require('fs');
var path = require('path');
var qs = require('querystring');

var fps = {};

fileSystem.readFile('./data.json', function read(err, data) {
    if (err) {
        // don't care
    } else {
        fps = JSON.parse(data);
    }
    startServer();
});

function countProperties(ident) {
    if (!(ident in fps)) return 0;
    var fp = fps[ident];
    var cnt = 0;
    for (f in fp) {
        if (fp.hasOwnProperty(f) && fp[f].length == 1) cnt++;
    }
    return cnt;
}

function startServer() {
    http.createServer(function(req, res) {
        console.log(req.url);


        if (req.method == 'POST') {
            var body = '';

            req.on('data', function(data) {
                body += data;
            });

            req.on('end', function() {
                var parsed = qs.parse(body);
                var ident = parsed.ident;
                var log = JSON.parse(new Buffer(parsed.log.replace(/-/g, "="), 'base64').toString());

                var fp;
                if (!(ident in fps)) {
                    fps[ident] = {};
                }
                fp = fps[ident];
                for (var k in log) {
                    if (k in fp) {
                        if (fp[k].indexOf(log[k]) == -1) fp[k].push(log[k]);
                    } else {
                        fp[k] = [log[k]];
                    }
                }

                var count = 0;
                for (var i in fp) {
                    if (fp[i].length == 1) count++;
                }

                fileSystem.writeFileSync('./data.json', JSON.stringify(fps), 'utf-8');

                console.log(count);
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });
                res.end();
            });
        } else {
            if (req.url.indexOf("/stat") == 0) {
                var params = req.url.substr(req.url.indexOf("/stat?") + 6).split("&");
                var b1 = new Buffer(params[0].substr(params[0].indexOf("c1=") + 3).replace(/-/g, "="), "base64").toString();
                var b2 = new Buffer(params[1].substr(params[1].indexOf("c2=") + 3).replace(/-/g, "="), "base64").toString();
                console.log(b1 + " vs " + b2);
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                // get all browsers
                var ids = [b1, b2];

                // get all properties
                var all_keys = [];
                for (var identity in ids) {
                    if (!fps.hasOwnProperty(ids[identity])) continue;

                    for (var i in fps[ids[identity]]) {
                        if (!fps[ids[identity]].hasOwnProperty(i)) continue;
                        if (all_keys.indexOf(i) == -1) {
                            all_keys.push(i);
                        }
                    }
                }

                // cross-check property
                res.write("<table cellspacing=2 cellpadding=2 border=1 style='border: 1px solid gray; border-collapse: collapse;'><tr><th>Property</th><th>" + b1 + "</th><th>" + b2 + "</th></tr>");

                count = 0;
                for (var k in all_keys) {
                    var d = [];
                    for (var i in ids) {
                        if (fps[ids[i]][all_keys[k]] === undefined) {
                            var add = true;
                            for (var j in d) {
                                if (d[j] === undefined) {
                                    add = false;
                                    break;
                                }
                            }
                            if (add) d.push(undefined);
                        } else {
                            if (fps[ids[i]][all_keys[k]].length == 1) {
                                if (d.indexOf(fps[ids[i]][all_keys[k]][0]) == -1) d.push(fps[ids[i]][all_keys[k]][0]);
                            }
                        }
                    }
                    if (d.length > 1) {
                        res.write("<tr><td>" + all_keys[k] + "</td>");

                        for (var value in d) {
                            res.write("<td>" + d[value] + "</td>");
                        }
                        count++;

                        res.write("</tr>");
                    }
                }
                console.log(count + " properties differ");
                res.write("</table>");
                res.write("<br /><br /><b>" + count + "</b> properties differ. <a href='/'>[ Home ]</a>");

                res.end();
            } else if (req.url == "/record") {
                var filePath = path.join(__dirname, 'jta.html');
                var stat = fileSystem.statSync(filePath);

                res.writeHead(200, {
                    'Content-Type': 'text/html',
                    'Content-Length': stat.size
                });

                var readStream = fileSystem.createReadStream(filePath);
                readStream.pipe(res);
            } else {
                if (req.url.indexOf("/delete") == 0) {
                    var identifier = new Buffer(req.url.substr(req.url.indexOf("?id=") + 4).replace(/-/g, "="), "base64").toString();
                    console.log("Deleting " + identifier);
                    if (identifier in fps) {
                        delete fps[identifier];
                        fileSystem.writeFileSync('./data.json', JSON.stringify(fps), 'utf-8');
                    }
                }

                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write("<h1>JavaScript Templates</h1>");
                res.write("<br/><input type='button' value='Record' onclick='document.location.href=\"/record\";'><br/>");
                res.write("<h2>Profiles</h2>");
                res.write("<table cellspacing=2 cellpadding=2 border=1 style='border: 1px solid gray; border-collapse: collapse;'><tr><th>Browser Identifier</th><th>Properties</th><th>Action</th></tr>");
                for (fp in fps) {
                    var cnt = countProperties(fp);
                    var identifier = (new Buffer(fp)).toString("base64").replace(/=/g, "-");
                    res.write("<tr><td>" + fp + "</td><td>" + cnt + "</td><td><a href='/delete?id=" + identifier + "'>[ Delete ]</a> &nbsp; <a href='record#" + identifier + "'>[ Record more Traces ]</a></tr>");
                }
                res.write("</table>");

                res.write("<h2>Compare</h2>");
                res.write("<select id='c1'>");
                for (fp in fps) {
                    var identifier = (new Buffer(fp)).toString("base64").replace(/=/g, "-");
                    res.write("<option value='" + identifier + "'>" + fp + "</option>");
                }
                res.write("</select>");
                res.write(" with ");
                res.write("<select id='c2'>");
                for (fp in fps) {
                    var identifier = (new Buffer(fp)).toString("base64").replace(/=/g, "-");
                    res.write("<option value='" + identifier + "'>" + fp + "</option>");
                }
                res.write("</select>");
                res.write(" &nbsp; <input type='button' value='Compare' onclick='document.location.href=\"/stat?c1=\" + document.getElementById(\"c1\").value + \"&c2=\" + document.getElementById(\"c2\").value;'>");

                res.end();
            }
        }
    }).listen(8080);
}
